// DIRT: Deferred Image-based Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
// This file contains the implementation for HiZ tracing through multiple views.
// 1. createHitRecord	- creates the hit record
// 2. swap				- basic swap function
// 2. clipViewport	 	- clips the point P1 against a viewport
// 3. traceScreenSpaceRay_abuffer_cube - trace a ray hierarchically in screen space in a single view
// 4. traceScreenSpaceRay_abuffer - trace a ray in multiple views

// createHitRecord - creates the hit record data
// First, since the resolution of the id buffer could be lower, a projection operation transforms the intersection location to the corresponding pixel.
// Then, a new node is inserted at that location of the hit buffer. This way, we can perform a rasterization step (the Fetch pass) and fetch the data required.
// Parameters
// - cubeindex, the face at which the intersection occured
// The hit record data containing the barycentric coordinates, the primitive id and the intersection position 
// are stored in the global variables out_hit_barycentric, out_primitive_id, out_hit_wcs respectively
// The global variables used are:
// out_hit_wcs, containing the intersection location in world space
void createHitRecord(int cubeindex)
{
	// convert hit_coords to high res
	vec4 hit_buffer_pixel_location = uniform_view_pixel_proj_high_res[cubeindex] * vec4(out_hit_wcs, 1);
	hit_buffer_pixel_location.xy /= hit_buffer_pixel_location.w;

	// starts counting from 1, head points to zero
	uint hit_buffer_index = atomicCounterIncrement(next_address) + 1U;
	nodes_hit[hit_buffer_index].next = exchangeHitBufferHead(ivec2(hit_buffer_pixel_location.xy), hit_buffer_index);

	// Hit record data
	// the primitive id
	nodes_hit[hit_buffer_index].primitive_id 	= out_primitive_id;
	// the shading buffer pixel location where the tracing started (G[k]) and also
	// the shading buffer pixel location where the Fetch pass will save the interpolated values
	nodes_hit[hit_buffer_index].owner 			= ivec2(gl_FragCoord.xy);
	// barycentric coordinates and view index
	nodes_hit[hit_buffer_index].barycentric_view = vec4(out_hit_barycentric, cubeindex, 0.0);
}

// The traceScreenSpaceRay_abuffer and traceScreenSpaceRay_abuffer_cube function are based on 
// Vardis et al., A Multiview and Multilayer Approach for Interactive Ray Tracing (i3D 2016)
// Link: http://dl.acm.org/citation.cfm?id=2856401
// but are slightly modified here to handle a primitive based pipeline
//
// The homogeneous screen space ray tracing logic is based on
// Morgan McGuire and Michael Mara, Efficient GPU Screen-Space Ray Tracing, Journal of Computer Graphics Techniques (JCGT), vol. 3, no. 4, 73-85, 2014
// Link: http://jcgt.org/published/0003/04/04/
// The traceScreenSpaceRay_abuffer_cube contains similar manipulations for screen space tracing
// but is applied here to hierarchical screen space tracing

// swap functions
// Parameters
// - a, value to be swapped
// - b, value to be swapped
// Returns the incoming values swapped
void swap(in out float a, in out float b) {
     float temp = a;
     a = b;
     b = temp;
}
void swap(in out vec3 a, in out vec3 b) {
     vec3 temp = a;
     a = b;
     b = temp;
}

#define VIEWPORT_NO_EXIT -1
#define VIEWPORT_EXIT_UP 0
#define VIEWPORT_EXIT_DOWN 1
#define VIEWPORT_EXIT_RIGHT 2
#define VIEWPORT_EXIT_LEFT 3
// clipViewport - returns a clipping parameter between P0, P1 against a viewport
// as well as the exit location
// Parameters
// - P0, a point inside the viewport (if P0 is outside then this function returns un)
// - P1, a point potentially outside the viewport
// Returns the incoming values swapped
// Note: point P0 needs to be inside the viewport
float clipViewport(vec2 P0, vec2 P1, vec4 viewport)
{
	float alpha = 1.0;

	if (P1.y > viewport.w || P1.y < viewport.y)
	{
		alpha = (((P1.y > viewport.w) ? viewport.w : viewport.y) - P0.y) / (P1.y - P0.y);
	}
	
	if (P1.x > viewport.z || P1.x < viewport.x)
	{
		alpha = min(alpha, (((P1.x > viewport.z) ? viewport.z : viewport.x) - P0.x) / (P1.x - P0.x));
	}

	return alpha;
}

#define ABUFFER_FACE_NO_HIT_EXIT -1
#define ABUFFER_FACE_HIT 1	
#define ABUFFER_FACE_NO_HIT_CONTINUE 2
// Trace a view hierarchically in screen-space based on a start position and a direction
// Given a start position in screen space:
// - Clip the ray against the near,far plane and viewport
// - Move hierarchically in homogeneous space by starting at the highest lod level (lod 0 = 1 pixel) and iteratively checking for an intersection between the ray's min/max depth bounds and the mipped min/max depth bounds texture 
// - if there is no intersection with the mipped depth bounds texture, move to the end of the current tile and decrease the lod level (increase the tile size)
// - if there is an intersection with the mipped depth bounds texture, increase the lod level
// - in case the iteration has reached the lowest lod level (denoted by the uniform_ab_mipmap variable), then check the id buffer for an actual intersection
// If a hit is found, return ABUFFER_FACE_HIT and store the hit intersection data in the hit buffer
// If hit is not found, return any of the other two conditions and either exit entirely (e.g. the view's far plane has been reached)
// or continue tracing to another face. 
// Parameters:
// - csOrigin, the ray origin in eye space
// - csDirection, the ray direction in eye space
// - buffer_size, the XY size of the current view. 
// - cubeindex, the current view's face index. This is required for retrieving the appropriate view-projection matrices of each view
// - new_hitpoint, the ray's current position. Used only if no hit is found to selected a different view
//
// The uniform variables used are:
// uniform_ab_mipmap, which denotes the lod level of the downscaled id buffer e.g. for a tile of 1x1 uniform_ab_mipmap = 0, for a tile of 2x2 uniform_ab_mipmap = 1, etc.
// This is used since the Trace pass can potentially occur in a higher resolution than the id buffer
// uniform_near_far, an array containing the near far clipping distance for all views
// uniform_scene_length, a value containing the diagonal size of the scene's bounding box
// uniform_view, an array containing the world->eye transformation for all views
// uniform_pixel_proj, an array containing the eye->pixel transformation for all views
int traceScreenSpaceRay_abuffer_cube
	(vec3       csOrigin, 
    vec3        csDirection,	
	vec2		buffer_size,
	int			cubeindex,
	out vec3	new_hitpoint) {

	int result = ABUFFER_FACE_NO_HIT_EXIT;
	
	// clip with near and far plane
	// need to check also for ray parallel to planes to avoid dividing by near zero values (dot product ~= 0)
	vec2 denom = vec2(dot(csDirection, nearPlaneNormal), dot(csDirection, farPlaneNormal));
	
	vec3 nearPlaneNormal= vec3(0,0,-1);
	vec3 farPlaneNormal=vec3(0,0,1);
	float range = uniform_scene_length;
	float length_to_near = (denom.x != 0.0) ? -(dot(csOrigin, nearPlaneNormal) - uniform_near_far[cubeindex].x) / denom.x : range;
	length_to_near = (length_to_near < range && length_to_near > EPSILON) ? length_to_near : range;
	float length_to_far  = (denom.y != 0.0) ? -(dot(csOrigin, farPlaneNormal) + uniform_near_far[cubeindex].y) / denom.y : range;
	length_to_far = (length_to_far < range && length_to_far > EPSILON) ? length_to_far : range;
	float clipped_length = min(length_to_near, length_to_far);
	vec3 csEndPoint = csDirection * clipped_length + csOrigin;
	
    // Project into screen space
    vec4 H0 = uniform_pixel_proj[cubeindex] * vec4(csOrigin, 1.0);
    vec4 H1 = uniform_pixel_proj[cubeindex] * vec4(csEndPoint, 1.0);

    float k0 = 1.0 / H0.w;
    float k1 = 1.0 / H1.w;

    // Switch the original points to values that interpolate linearly in 2D
    vec4 Q_k0 = vec4(csOrigin * k0, k0);
    vec4 Q_k1 = vec4(csEndPoint * k1, k1);
	
	// Screen-space endpoints
    vec2 P0 = H0.xy * Q_k0.w;
    vec2 P1 = H1.xy * Q_k1.w;	

	// positive is away from the camera, negative towards
	int signdz = -int(sign(csEndPoint.z-csOrigin.z));

	// Initialize to off screen
    vec2 hitPixel = vec2(-1.0, -1.0);

	int layer = invalid_result;

    // If the line is degenerate, select the appropriate layer according to the ray direction
	if (ivec2(P0) == ivec2(P1))
	{
		// check the depth bounds texture or the id buffer for an intersection (based on the lod level)
		layer = analytic_ssrt(P0, csOrigin.z, csOrigin.z, 1, 0, cubeindex, signdz);
		// if we have a hit
		if (layer > invalid_result)
		{
			result = ABUFFER_FACE_HIT;
			// create a hit record
			createHitRecord(cubeindex);
		}
	}
	
    // Clipping to viewport	
	float offset = 0.0;
	vec4 viewport = vec4(offset,offset,buffer_size.x-offset, buffer_size.y-offset);
	float alpha = clipViewport(P0, P1, viewport, viewport_exit);

	P1 = mix(P0, P1, alpha); Q_k1 = mix(Q_k0, Q_k1, alpha);

    vec2 delta = P1 - P0;

    // Permute so that the primary iteration is in x to reduce
    // large branches later
    bool permute = false;
	if (abs(delta.x) < abs(delta.y)) {
		// More-vertical line. Create a permutation that swaps x and y in the output
		permute = true;
		delta = delta.yx;
		P1 = P1.yx;
		P0 = P0.yx;        
	}
    
	// From now on, "x" is the primary iteration direction and "y" is the secondary one
    float stepDirection = sign(delta.x);
    float invdx = stepDirection / delta.x;
    vec2 dP = vec2(stepDirection, invdx * delta.y);
	
    // Track the derivatives of Q and k
	vec4 dQ_k = (Q_k1 - Q_k0) * invdx;

	delta = P1 - P0;
	
	float pixel_offset = 0.0;

    // P1.x is never modified after this point, so pre-scale it by 
    // the step direction for a signed comparison
    float end = P1.x * stepDirection;
	
	// Slide P from P0 to P1, (now-homogeneous) Q from Q0 to Q1, and k from k0 to k1
	// and move the first intersection to the next pixel instead of the current one
	vec2  P = P0 + dP * pixel_offset; 
	vec4 Q_k = Q_k0 + dQ_k * pixel_offset;

	float rnd = 0.0;
	
	float half_pixel_offset = 0.5;
	
	float rayZMin;
	float rayZMax;

	int		lod			= uniform_ab_mipmap;
	int		step_lod	= int(pow(2, lod));
	float	divstep		= 1.0 / step_lod;

	ivec2	lod_coords;
	vec2	f_viewport_c;
	vec4	Q_k_tmp;
	vec4	f_viewport;
	float	lod_alpha;
	vec2	_P0 = permute ? P0.yx : P0; 
	vec2	_P1 = permute ? P1.yx : P1;
	
	// find the min and max Z extent ray positions based on the starting position
	hitPixel.xy		 = permute ? P.yx : P;
	lod_coords		 = ivec2(floor(hitPixel * divstep));
	f_viewport.xy	 = lod_coords	  << lod;
	f_viewport.zw	 = f_viewport.xy  + step_lod;
	f_viewport_c	 = f_viewport.xy + vec2(divstep * 0.5);

	lod_alpha = clipViewport(hitPixel, _P0, f_viewport);
	Q_k_tmp = mix(Q_k, Q_k0, lod_alpha);
	rayZMin = (Q_k_tmp.z) / (Q_k_tmp.w); 
	
	lod_alpha = clipViewport(hitPixel, _P1, f_viewport);		
	Q_k_tmp = mix(Q_k, Q_k1, lod_alpha);
	rayZMax = (Q_k_tmp.z) / (Q_k_tmp.w); 

	// iterate until
	// we have reached the end of the clipped ray within the view or
	// or have reached the far plane
	// or have a hit (lod is lower than the lowest lod level)
	while (P.x * stepDirection <= end && rayZMax < 0 && lod+1 > uniform_ab_mipmap)
	{
		// verification check
		// if during traversal towards the far plane we exit it (therefore the z sign is flipped)
		// simply replace the value with the far plane value for comparison
		if (rayZMax >= 0) rayZMax = -uniform_near_far[cubeindex].x;
		if (rayZMax >= 0) rayZMax = -uniform_near_far[cubeindex].y;
		if (rayZMin > rayZMax)			swap(rayZMin, rayZMax);

		// check the depth bounds texture or the id buffer for an intersection (based on the lod level)
		layer = analytic_ssrt(f_viewport_c, rayZMin, rayZMax, divstep, lod, cubeindex, signdz);

		// no hit
		if (layer == invalid_result)
		{
			P  = mix(P, P1, lod_alpha);  
			Q_k = Q_k_tmp; 
			P += dP * half_pixel_offset; 
			Q_k += dQ_k * half_pixel_offset;

			// reset lod - recompute pixel step
			lod = min(uniform_depth_mipmap+1, lod+2);
		}

		lod--;
		step_lod = int(pow(2, lod));
		divstep  = 1.0 / step_lod;

		hitPixel	  = permute ? P.yx : P;
		lod_coords	  = ivec2(floor(hitPixel * divstep));
		f_viewport.xy = lod_coords << lod;
		f_viewport.zw = f_viewport.xy + vec2(step_lod);
		f_viewport_c  = f_viewport.xy + vec2(divstep * 0.5);

		lod_alpha = clipViewport(hitPixel, _P0, f_viewport);
		Q_k_tmp = mix(Q_k, Q_k0, lod_alpha);
		rayZMin = (Q_k_tmp.z) / (Q_k_tmp.w); 

		lod_alpha = clipViewport(hitPixel, _P1, f_viewport);		
		Q_k_tmp = mix(Q_k, Q_k1, lod_alpha);
		rayZMax = (Q_k_tmp.z) / (Q_k_tmp.w); 
	}

	// if we have a hit
	if (layer > invalid_result)
	{
		result = ABUFFER_FACE_HIT;
		// create a hit record
		createHitRecord(cubeindex);
	}
	else
	{
		hitPixel = permute ? P.yx : P;
		vec3 pecs = vec3(Q_k.xyz * (1.0 / Q_k.w));
		vec4 pndc = vec4(pecs,1) * uniform_proj[cubeindex];
		pndc.xyz/=pndc.w;
		
		// if there is no hit we need to check if we exited any of the surrounding frurstum planes
		// EXCEPT the far plane, in which case there is no hit.
		// In that case, continue to the next face
		// Note: for same size viewports of all faces, the buffer_size parameter is constant
		if (pndc.z >= 1.0)
		{
			result = ABUFFER_FACE_NO_HIT_EXIT;
		}
		else if (pndc.z <= 0)
		{
			new_hitpoint = pecs + csDirection * uniform_near_far[cubeindex].x * 1;
			result = ABUFFER_FACE_NO_HIT_CONTINUE;
		}
		else if (alpha < 1.0 && P.x * stepDirection > end)
		{
			// we are clipping against half pixel boundaries, therefore some rays might not exit the viewport as expected. 
			// Ensure that the ray will be outside the current viewport (therefore inside the next viewport) 
			// by moving the ray origin outside the current viewport
			// reset to the original values
			float _k1 = 1.0 / H1.w;
			vec3 _Q1 = csEndPoint * _k1;
			vec2 _P1 = H1.xy * _k1;
			offset = 0.01;
			// set the viewport to clip half a pixel outside the current boundaries
			vec4 viewport = vec4(-offset, -offset, buffer_size.x + offset, buffer_size.y + offset);
			alpha = clipViewport(hitPixel, _P1, viewport);
			hitPixel = mix(hitPixel, _P1, alpha); _k1 = mix(Q_k.w, _k1, alpha); _Q1 = mix(Q_k.xyz, _Q1, alpha);
			pecs = vec3(_Q1 / _k1);
			new_hitpoint = pecs;
			result = alpha < 1.0 ? ABUFFER_FACE_NO_HIT_CONTINUE : ABUFFER_FACE_NO_HIT_EXIT;
			vec4 pndc = vec4(pecs,1) * uniform_proj[cubeindex];
			pndc.xyz/=pndc.w;
			if (pndc.z <= 0)
			{
				new_hitpoint = pecs + csDirection * uniform_near_far[cubeindex].x * 1;
				result = ABUFFER_FACE_NO_HIT_CONTINUE;
			}
		}
	}

	return result;
}

// this struct avoids iterating through faces we have already looked at
// in order to avoid unnecessary transformations
struct FACE{bool used;};
FACE faces[MAX_FACE_LAYERS];

// Trace a ray in the multiview structure based on a start position and a direction.
// The algorithm operates in eye space coordinates
// parameters:
// - csOrigin, the ray origin
// - csDirection, the ray direction
// - cubeindex, the current view's face index. This is required for retrieving the appropriate view-projection matrices of each view
//
// Returns true if a hit has been found
// The uniform variables used are:
// uniform_view, an array containing the world->eye transformation for all views
// uniform_view_inverse, an array containing the eye->world transformation for all views
// uniform_viewports, an array containing the viewport for all views
#define MAX_FACE_LAYERS 6
bool traceScreenSpaceRay_abuffer
(vec3        csOrigin, 
vec3        csDirection,
int			cubeindex) 
{		
	ivec2 buffer_size = ivec2(uniform_viewports[cubeindex]);
	// each vertex stores its position in the primary ECS
	// convert it to the required face's ECS
	csOrigin = vec3(uniform_view[cubeindex] * uniform_view_inverse[0] * vec4(csOrigin, 1)).xyz;
	csDirection = vec3(uniform_view[cubeindex] * uniform_view_inverse[0] * vec4(csDirection, 0)).xyz;

	vec3 new_hitpoint = vec3(0);

	result = ABUFFER_FACE_NO_HIT_CONTINUE;
	bool has_hit = false;

	for (int i = 0; i < MAX_FACE_LAYERS; ++i)
		faces[i].used = false;

	while (result > ABUFFER_FACE_HIT && counter < MAX_FACE_LAYERS)
	{
		// trace that face
		result = traceScreenSpaceRay_abuffer_cube(csOrigin, csDirection, buffer_size, cubeindex, new_hitpoint);

		// find new face
		if (result == ABUFFER_FACE_HIT || result == ABUFFER_FACE_NO_HIT_EXIT)
			break;

		faces[cubeindex].used = true;
		int new_cube_index = 0;

		result = ABUFFER_FACE_NO_HIT_EXIT;
		bool outside_frustum = true;
		for (int i = 0; i < MAX_FACE_LAYERS && outside_frustum == true; ++i)
		{
			// do not look at the same face
			if (faces[i].used == true) continue;

			mat4x4 transform = uniform_view[i] * uniform_view_inverse[cubeindex];
			csOrigin = vec3(transform * vec4(new_hitpoint, 1)).xyz;
			vec4 H0 = uniform_proj[i] * vec4(csOrigin, 1.0);
			outside_frustum = ((clamp(H0.xyz, vec3(-H0.w), vec3(H0.w)) - H0.xyz) != vec3(0));					
			if (!outside_frustum)
			{
				// transform the position and direction of the ray to each new space
				csDirection = vec3(transform * vec4(csDirection, 0)).xyz;
				buffer_size = ivec2(uniform_viewports[i]);
				cubeindex = i;
				new_cube_index = i;
				result = ABUFFER_FACE_NO_HIT_CONTINUE;
			}
		}
	}		
	return result == ABUFFER_FACE_HIT;
}