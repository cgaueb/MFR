// DIRT: Deferred Image-based Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
// This file contains the code for:
// 1. Ray-triangle intersection - rayTriangleIntersect
// 2. Hi-Z skipping and bucket tracing (Algorithm 1 in the paper) - analytic_ssrt

// the number of buckets (per view)
#define BUCKET_SIZE		__BUCKET_SIZE__
#define BUCKET_SIZE_1n	BUCKET_SIZE - 1
#define FLT_MAX 3.402823466e+38f
 
// rayTriangleIntersect
// Code downloaded and modified from:
// http://graphicscodex.com/Sample2-RayTriangleIntersection.pdf
// If ray P + tw hits triangle V[0], V[1], V[2], then the
// function returns true, stores the barycentric coordinates in
// b[], and stores the distance to the intersection in t.
// Otherwise returns false and the other output parameters are
// undefined.
// Parameters:
// P 		- the ray origin in world space coordinates
// w 		- the ray direction in world space coordinates
// primitive_id - the primitive id
// b		- stores the barycentric coordinates
// Returns the intersection distance, otherwise -1
float rayTriangleIntersect(const vec3 P, const vec3 w, const uint primitive_id, out vec2 b) 
{	
	NodeTypeVertexBuffer prim = nodes_vertex[primitive_id];

	// Edge vectors
	vec3 e_1 = prim.vertex2.xyz - prim.vertex1.xyz;
	vec3 e_2 = prim.vertex3.xyz - prim.vertex1.xyz;

	// Face normal
	vec3 n = normalize(cross(e_1, e_2));
	vec3 q = cross(w, e_2);
	float a = dot(e_1, q);

	vec3 s = (P - prim.vertex1.xyz) / a;
	vec3 r = cross(s, e_1);

	// Barycentric coordinates
	b  = vec2(dot(s, q), dot(r, w));

	return any(bvec4(abs(a) <= EPSILON, b.x < 0.0, b.y < 0.0, b.x + b.y > 1.0)) ? -1.0 : dot(e_2, r);
}

// analytic_ssrt
// Steps: 
// 1. first check for any intersections with the HiZ texture based on the current lod level
// 2. if there is an intersection, check if we are in the lowest lod level, otherwise return and refine (reduce the lod level)
// 3. if there is an intersection and we are at the lowest lod level
// 4. find the buckets the ray intersects
// 5. find the direction of traversal and start traversal based on this
// 6. traverse all intersected buckets in the id buffer and look for ray primitive intersections.
// An intersection has occured only when both of the conditions have met:
// a) there is an intersection with a primitive and is the shortest one (t_hit > 0, t_hit < t_min).
// b) the intersection has occured at the sample pixel we currently are.
// If an intersection has been found within a bucket, gather the hit record data, skip any remaining buckets and return.
// Parameters:
// coords 		- the pixel coordinates that are traced (in high resolution)
// minZ, maxZ 	- the rays Z extents
// divstep		- a scalar value transforming the high resolution coord to low resolution (1.0 / int(pow(2, lod)))
// lod 			- the current HiZ lod level
// cubemapindex - the view index currently traced
// increment 	- a scalar value indicating the ray direction. It is positive if the ray is moving in the direction of the camera, 
// negative towards the camera
// Returns 1 for a valid intersection, otherwise -1
// The hit record data containing the barycentric coordinates, the primitive id and the intersection position 
// are stored in the global variables out_hit_barycentric, out_primitive_id, out_hit_wcs respectively
// in order to avoid passing them around functions
// The uniform variables used are:
// uniform_ab_mipmap, which denotes the lod level of the downscaled id buffer e.g. for a tile of 1x1 uniform_ab_mipmap = 0, for a tile of 2x2 uniform_ab_mipmap = 1, etc.
// This is used since the Trace pass can potentially occur in a higher resolution than the id buffer
// uniform_view_pixel_proj, an array containing the tranformation from world to pixel space for all views
// The global variables used are:
// ray_origin_wcs, containing the ray origin in world space
// ray_dir_wcs, containing the ray direction in world space
// out_hit_wcs, containing the intersection location in world space
int analytic_ssrt(vec2 coords, float minZ, float maxZ, float divstep, int lod, int cubemapindex, int increment)
{
	// maxZ out of bounds
	if (maxZ >= 0.0) return invalid_result;

	// all buckets are stored linearly, so offset by the view to retrieve the storage location of the first bucket
	// e.g. for 10 buckets, view0=0, view1=10, etc
	int cube_offset = cubemapindex * BUCKET_SIZE;

	// retrieve the coordinates in the depth mipmap texture
	ivec2 coords_lod    = ivec2(coords*divstep);
	vec2  depths		= texelFetch(tex_depth_bounds, ivec3(coords_lod, cubemapindex), lod - uniform_ab_mipmap).rg;

	// HiZ early skip if the rays extents are outside the depth bounds
	float	depth_near	= -depths.r;
	if (minZ >= -depth_near) return invalid_result;
	float	depth_far	= depths.g;
	if (maxZ <= -depth_far) return invalid_result;

	// if we have an intersection, return and refine to lower lod levels
	if(lod > uniform_ab_mipmap) return invalid_lod;

	// if we have reached the lowest lod level, we need to traverse the ID buffer
	// find the bucket range by checking the buckets intersected by the ray's Z extents 
	float	depth_length = depth_near - depth_far;
	int		b0 = (maxZ >= -depth_near)						  ? 0			   : max(min(int((float(BUCKET_SIZE)*((depth_near + maxZ) / depth_length))), BUCKET_SIZE_1n),0);
	int		b1 = (b0 == BUCKET_SIZE_1n || minZ <= -depth_far) ? BUCKET_SIZE_1n : max(min(int((float(BUCKET_SIZE)*((depth_near + minZ) / depth_length))), BUCKET_SIZE_1n),0);
	
	// offset the buckets for the view required
	b0 = cube_offset + b0;
	b1 = cube_offset + b1;

	// Bucket skipping. Check the direction of the ray
	// increment is positive if the ray is moving in the direction of the camera, 
	// negative towards the camera (which must flip the search order)
	const bool	reverseZ = increment < 0;
	const int	inc		 = (reverseZ) ? -1 : 1;
		  int	b		 = (reverseZ) ? b1 : b0;
	const int	d		 = max(0, b1 - b0);

	// initialize variables
	uint index = 0u;
	float t_min = 100000;
	float t_hit = 0.0;
	vec4 hit_wcs = vec4(0,0,0,1);
	vec2 barycentric = vec2(0);
	vec4 hit_pixel;
	out_primitive_id = 0x7FFFFFFF;
	NodeTypeIDBuffer node;
	
	// traverse each intersected bucket in the id buffer
	for (int i = 0; i <= d && index == 0u; i++, b += inc)
	{
		// get the first node in the linked list for that bucket
		index = getPixelHeadIDBuffer(ivec2(coords_lod), b);
		// traverse the bucket
		while (index != 0U)
		{
			node = nodes_id[index];
			
			// check for ray-triangle intersection
			t_hit = rayTriangleIntersect(ray_origin_wcs, ray_dir_wcs, node.primitive_id, barycentric);
			// validation 1: check if the intersection distance is the shortest so far
			if (all(bvec2(t_hit > 0, t_hit < t_min)))
			{
				// validation 2: project the hit point to the id buffer resolution
				// and check if the intersected primitive is located there
				hit_wcs.xyz		= ray_origin_wcs + t_hit * ray_dir_wcs;
								
				hit_pixel		= uniform_view_pixel_proj[cubemapindex] * hit_wcs;
				hit_pixel.xy   /= hit_pixel.w;
				
				ivec2 res = (ivec2(coords_lod) - ivec2(hit_pixel.xy));
				if(all(equal(res, ivec2(0)))
				{
					t_min = t_hit;
					out_primitive_id = node.primitive_id;
					out_hit_barycentric = barycentric;
				}
			}
			index = node.next;
		}
	}

	out_hit_wcs = ray_origin_wcs + t_min * ray_dir_wcs;
	return (out_primitive_id == 0x7FFFFFFF) ? invalid_result : 1;
}