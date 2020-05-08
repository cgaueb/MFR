// DIRT: Deferred Image-based Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
// This file contains the code for clipping primitives against the pixel frustum boundaries
// This function is used twice during the Build stage:
// First, in the Fill Depth pass to calculate the Z extents for the clipped primitives
// Second, in the Fill Primitives pass to compare a clipped primitive against the stored Z extents and place them in the appropriate depth subintervals (buckets)

#define EPSILON 0.0000001
#define LTF 0
#define RTF 1
#define LBF 2
#define RBF 3
#define LTN 4
#define RTN 5
#define LBN 6
#define RBN 7
#define NEAR	0
#define FAR		1
#define RIGHT	2
#define LEFT	3
#define TOP		4
#define BOTTOM	5

// clip
// This is an approximate - but faster clipping function
// instead of clipping against six planes, we clip the plane containing the triangle against the four lines connecting the near and far plane vertices, along with the near and far clipping distance
// the downside of this approximation results in overapproximation of the clipping distances, which is more evident in oblique primitives against the view
// Parameters:
// cubeindex  - the current view index
// p1, p2, p3 - the vertex positions
// Returns the clipped Z extents of the primitive for the current pixel
// 
// The uniform variables used are:
// uniform_plane_points_wcs, an array containing the world space position of the frustum corners for all views
// uniform_near_far, an array containing the near far clipping distance for all views
// uniform_view_array, an array containing the world->eye transformation for all views
// uniform_viewports, an array containing the viewport for all views
vec2 clip(int cubeindex, vec3 p1, vec3 p2, vec3 p3)
{
	// initialize the clip result to false;
	bvec2 clipped = bvec2(false);
				
	// locally store the world space position of the frustum corners
	// which are calculated in the CPU side
	vec3 external_points_wcs[8];
	int points_index = cubeindex * 8;
	external_points_wcs[LTF] = vec3(uniform_plane_points_wcs[points_index + LTF]);
	external_points_wcs[RTF] = vec3(uniform_plane_points_wcs[points_index + RTF]);
	external_points_wcs[LBF] = vec3(uniform_plane_points_wcs[points_index + LBF]);
	external_points_wcs[RBF] = vec3(uniform_plane_points_wcs[points_index + RBF]);
	external_points_wcs[LTN] = vec3(uniform_plane_points_wcs[points_index + LTN]);
	external_points_wcs[RTN] = vec3(uniform_plane_points_wcs[points_index + RTN]);
	external_points_wcs[LBN] = vec3(uniform_plane_points_wcs[points_index + LBN]);
	external_points_wcs[RBN] = vec3(uniform_plane_points_wcs[points_index + RBN]);

	// store the pixel position
	vec4 f_viewport = vec4(0);
	f_viewport.xy = floor(gl_FragCoord.xy);
	f_viewport.zw = f_viewport.xy  + vec2(1);
	
	// get interpolation parameters for this pixel in the range [0,1)
	// uniform_viewports.zw stores the viewport dimensions for the particular view
	vec2 fragCoord_lb = vec2(f_viewport.x, f_viewport.y) / uniform_viewports[cubeindex].zw;
	vec2 fragCoord_rt = vec2(f_viewport.z, f_viewport.w) / uniform_viewports[uniform_cube_index].zw;
	
	// and store them
	float top_a		= fragCoord_rt.y;
	float right_a	= fragCoord_rt.x;
	float bottom_a	= fragCoord_lb.y;
	float left_a	= fragCoord_lb.x;
	
	// calculate pixel frustum points by interpolating using the external frustum positions
	vec3 pixel_pos_wcs[8];
	vec3 vertical1;
	vec3 vertical2;
	vertical1 = mix(external_points_wcs[LBF], external_points_wcs[LTF], top_a);
	vertical2 = mix(external_points_wcs[RBF], external_points_wcs[RTF], top_a);
	pixel_pos_wcs[LTF] = mix(vertical1, vertical2, left_a);
	pixel_pos_wcs[RTF] = mix(vertical1, vertical2, right_a);
	vertical1 = mix(external_points_wcs[LBF], external_points_wcs[LTF], bottom_a);
	vertical2 = mix(external_points_wcs[RBF], external_points_wcs[RTF], bottom_a);
	pixel_pos_wcs[LBF] = mix(vertical1, vertical2, left_a);
	pixel_pos_wcs[RBF] = mix(vertical1, vertical2, right_a);
	vertical1 = mix(external_points_wcs[LBN], external_points_wcs[LTN], top_a);
	vertical2 = mix(external_points_wcs[RBN], external_points_wcs[RTN], top_a);
	pixel_pos_wcs[LTN] = mix(vertical1, vertical2, left_a);
	pixel_pos_wcs[RTN] = mix(vertical1, vertical2, right_a);
	vertical1 = mix(external_points_wcs[LBN], external_points_wcs[LTN], bottom_a);
	vertical2 = mix(external_points_wcs[RBN], external_points_wcs[RTN], bottom_a);
	pixel_pos_wcs[LBN] = mix(vertical1, vertical2, left_a);
	pixel_pos_wcs[RBN] = mix(vertical1, vertical2, right_a);		
	
	// create four rays from near to far
	vec3 ray_origin[4] = {
    pixel_pos_wcs[LTN],
    pixel_pos_wcs[RTN],
    pixel_pos_wcs[LBN],
    pixel_pos_wcs[RBN]
    };

	vec3 ray_line[4] = {
	 pixel_pos_wcs[LTF] -  pixel_pos_wcs[LTN],
	 pixel_pos_wcs[RTF] -  pixel_pos_wcs[RTN],
	 pixel_pos_wcs[LBF] -  pixel_pos_wcs[LBN],
	 pixel_pos_wcs[RBF] -  pixel_pos_wcs[RBN]
	};

	// find the triangle (plane) normal
	vec3 triangle_normal = cross(p2.xyz - p1.xyz, p3.xyz - p1.xyz);
	triangle_normal = normalize(triangle_normal);
	float triangle_d = 0;
	for (int i = 0; i < 3; ++i)
		triangle_d -= triangle_normal[i] * p1[i];

	float near = uniform_near_far[uniform_cube_index].x;
	float far = uniform_near_far[uniform_cube_index].y;
	float Zmin = far;
	float Zmax = near;	

	// perform ray-plane intersections for each ray
	// and store the min and max extents in eye space
	for (int i = 0; i < 4; ++i)
	{
		vec3 raystart = ray_origin[i];
		vec3 ray_dir = normalize(ray_line[i]);
		float td = -((dot(raystart, triangle_normal)) + triangle_d);
		float d = dot(ray_dir, triangle_normal);
		if (abs(d) < 0.001) continue;
		td = td / d;
		if (td > 0 && td < length(ray_line[i]))
		{
			vec3 intersectpoint_wcs = raystart + td * ray_dir;
			vec3 intersectpoint = vec3(uniform_view_array[uniform_cube_index] * vec4(intersectpoint_wcs, 1)).xyz;
			Zmin = max(near, min(Zmin, -intersectpoint.z));
			Zmax = min(far,  max(Zmax, -intersectpoint.z));
			if (abs(Zmin - -intersectpoint.z) < EPSILON) clipped.x = true;
			if (abs(Zmax - -intersectpoint.z) < EPSILON) clipped.y = true;
		}
	}
	
	if (!clipped.x) Zmin = near;
	if (!clipped.y) Zmax = far;
	return vec2(Zmin, Zmax);
}