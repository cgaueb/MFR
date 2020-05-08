// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou
// This file contains the implementation for tracing through multiple views.

//------------------------------------------------------------ TRACING START

// defines indicating the current tracing state
#define ABUFFER_FACE_NO_HIT_EXIT -1
#define ABUFFER_FACE_HIT 1	
#define ABUFFER_FACE_NO_HIT_CONTINUE_VIEWPORT 2
#define ABUFFER_FACE_NO_HIT_CONTINUE_NEAR_PLANE 3

// The traceScreenSpaceRay_abuffer_cube and the clipViewport functions are based on 
// Morgan McGuire and Michael Mara, Efficient GPU Screen-Space Ray Tracing, Journal of Computer Graphics Techniques (JCGT), vol. 3, no. 4, 73-85, 2014
// Link: http://jcgt.org/published/0003/04/04/
// The traceScreenSpaceRay_abuffer_cube contains the same methodology for tracing in pixel increments as the original paper
// but is modified to handle multiview and multifragment rendering
// The clipViewport is slightly modified to return the exit side

// swap float values
void swap(in out float a, in out float b) {
     float temp = a;
     a = b;
     b = temp;
}

vec3 nearPlaneNormal= vec3(0,0,-1);
vec3 farPlaneNormal=vec3(0,0,1);

#define VIEWPORT_NO_EXIT -1
#define VIEWPORT_EXIT_UP 0
#define VIEWPORT_EXIT_DOWN 1
#define VIEWPORT_EXIT_RIGHT 2
#define VIEWPORT_EXIT_LEFT 3

// clip the a point against the viewport and retrieve the exit side as well
// Note: point P0 needs to be inside the viewport
float clipViewport(vec2 P0, vec2 P1, vec4 viewport, out int viewport_exit)
{
	float alpha = 1.0;
	float tmp_alpha = 1.0;
	viewport_exit = VIEWPORT_NO_EXIT;

	if (P1.y > viewport.w)
	{
		tmp_alpha = (((P1.y > viewport.w) ? viewport.w : viewport.y) - P0.y) / (P1.y - P0.y);
		viewport_exit = VIEWPORT_EXIT_UP;
	}
	else if (P1.y < viewport.y)
	{
		tmp_alpha = (((P1.y > viewport.w) ? viewport.w : viewport.y) - P0.y) / (P1.y - P0.y);
		viewport_exit = VIEWPORT_EXIT_DOWN;
	}

	if (P1.x > viewport.z)
	{
		alpha = min(tmp_alpha, (((P1.x > viewport.z) ? viewport.z : viewport.x) - P0.x) / (P1.x - P0.x));
		viewport_exit = alpha < tmp_alpha ? VIEWPORT_EXIT_RIGHT : viewport_exit;
	}
	else if (P1.x < viewport.x)
	{
		alpha = min(tmp_alpha, (((P1.x > viewport.z) ? viewport.z : viewport.x) - P0.x) / (P1.x - P0.x));
		viewport_exit = alpha < tmp_alpha ? VIEWPORT_EXIT_LEFT : viewport_exit;
	}
	else
		alpha = tmp_alpha;

	return alpha;
}

#define ABUFFER_FACE_NO_HIT_EXIT -1
#define ABUFFER_FACE_HIT 1	
#define ABUFFER_FACE_NO_HIT_CONTINUE_VIEWPORT 2
#define ABUFFER_FACE_NO_HIT_CONTINUE_NEAR_PLANE 3

// Trace a view on pixel increments based on a start position and a direction
// If a hit is found, return ABUFFER_FACE_HIT and store the newly created vertex in the out new_vertex parameter 
// If hit is not found, return any of the other three conditions and either exit entirely (e.g. the view's far plane has been reached)
// or continue tracing to another face. 
// Returning ABUFFER_FACE_NO_HIT_CONTINUE_VIEWPORT also sets the out viewport_exit parameter to the exit side of the viewport.
// The algorithm operates in eye space coordinates
// parameters:
// - csOrigin, the ray origin
// - csDirection, the ray direction
// - iteration, the current tracing iteration. this number increases for each view.
// - remaining_distance, the remaining distance for the ray. This is used only in limited range searching, such as Ambient Occlusion
// - buffer_size, the XY size of the current view. 
// - jitter, a jitter offset applied to the start position
// - cubeindex, the current view's face index. This is required for retrieving the appropriate view-projection matrices of each view
// - viewport_exit, the ray's viewport exit side if not hit is found and the ray has not exited via the near plane.
// - new_hitpoint, the ray's current position. Used only if no hit is found
// - new_vertex, the created vertex in case of a hit
//
int traceScreenSpaceRay_abuffer_cube
	(vec3       csOrigin, 
    vec3        csDirection,
	int			iteration,
#ifndef UNLIMITED_RAY_DISTANCE
	float		remaining_distance,
#endif // UNLIMITED_RAY_DISTANCE	
	vec2		buffer_size,
	float		jitter,
	int			cubeindex,
	out int		viewport_exit,
	out vec3	new_hitpoint,
    out Vertex  new_vertex) {

	int result = ABUFFER_FACE_NO_HIT_EXIT;
	
	// clip with near and far plane
	// need to check also for ray parallel to planes to avoid dividing by near zero values (dot product ~= 0)
	vec2 denom = vec2(dot(csDirection, nearPlaneNormal), dot(csDirection, farPlaneNormal));
	
#ifndef UNLIMITED_RAY_DISTANCE
	float range = remaining_distance;
#else
	float range = uniform_scene_length;
#endif // UNLIMITED_RAY_DISTANCE

	float length_to_near = (denom.x != 0.0) ? -(dot(csOrigin, nearPlaneNormal) - uniform_near_far[cubeindex].x) / denom.x : range;
	length_to_near = (length_to_near < range && length_to_near > 0.0000001) ? length_to_near : range;
	float length_to_far  = (denom.y != 0.0) ? -(dot(csOrigin, farPlaneNormal) + uniform_near_far[cubeindex].y) / denom.y : range;
	length_to_far = (length_to_far < range && length_to_far > 0.0000001) ? length_to_far : range;
	float clipped_length = min(length_to_near, length_to_far);
	vec3 csEndPoint = csDirection * clipped_length + csOrigin;
	
#ifndef UNLIMITED_RAY_DISTANCE
	remaining_distance -= max(0.0, clipped_length);
#endif // UNLIMITED_RAY_DISTANCE

    // Project into pixel space (e.g. 0->800)
    vec4 H0 = uniform_pixel_proj[cubeindex] * vec4(csOrigin, 1.0);
    vec4 H1 = uniform_pixel_proj[cubeindex] * vec4(csEndPoint, 1.0);

    float k0 = 1.0 / H0.w;
    float k1 = 1.0 / H1.w;

    // Switch the original points to values that interpolate linearly in 2D
    vec3 Q0 = csOrigin * k0; 
    vec3 Q1 = csEndPoint * k1;

	// Screen-space endpoints
    vec2 P0 = H0.xy * k0;
    vec2 P1 = H1.xy * k1;	
	
	// positive is away from the camera, negative towards
	int signdz = -int(sign(csEndPoint.z-csOrigin.z));

	// Initialize to off screen
    vec2 hitPixel = vec2(-1.0, -1.0);

	int layer = invalid_result;

     // If the line is degenerate, select the appropriate layer according to the ray direction
	if (ivec2(P0) == ivec2(P1))
	{
		float zMin = signdz > 0 ? -uniform_near_far[cubeindex].y : csEndPoint.z + 0.01;
		float zMax = signdz > 0 ? csOrigin.z-0.01 : -uniform_near_far[cubeindex].x;
		int l = ray_hit_a_buffer_search(ivec2(P0), zMin, zMax, vec2(THICKNESS), signdz, cubeindex);
		if (l > invalid_result)
		{
			result = ABUFFER_FACE_HIT;
			new_vertex = createVertex(vec3(P0, l), cubeindex);
		}
		return result;
	}
	
    // Clipping to viewport	
	float offset = 0.5;
	vec4 viewport = vec4(offset,offset,buffer_size.x-offset, buffer_size.y-offset);
	viewport_exit = VIEWPORT_NO_EXIT;
	float alpha = clipViewport(P0, P1, viewport, viewport_exit);
	P1 = mix(P0, P1, alpha); k1 = mix(k0, k1, alpha); Q1 = mix(Q0, Q1, alpha);	
    vec2 delta = P1 - P0;

    // Permute so that the primary iteration is in x to reduce
    // large branches later
    bool permute = false;
	if (abs(delta.x) < abs(delta.y)) {
		// More-vertical line. Create a permutation that swaps x and y in the output
		permute = true; delta = delta.yx; P1 = P1.yx; P0 = P0.yx;        
	}
    
	// From now on, "x" is the primary iteration direction and "y" is the secondary one
    float stepDirection = sign(delta.x);
    float invdx = stepDirection / delta.x;
    vec2 dP = vec2(stepDirection, invdx * delta.y);
	
    // Track the derivatives of Q and k
    vec3 dQ = (Q1 - Q0) * invdx;
    float dk = (k1 - k0) * invdx;

	// jitter only during the first iteration
	if (iteration == 0)
	{
		P0 += dP * jitter; Q0 += dQ * jitter; k0 += dk * jitter;
		delta = P1 - P0;
	}

    // P1.x is never modified after this point, so pre-scale it by 
    // the step direction for a signed comparison
    float end = P1.x * stepDirection;	

#ifndef CONSERVATIVE_MARCHING
	float stride = 1.0;
	float len = length(delta);
	float max_samples = float(MAX_SAMPLES_PER_RAY + 1);
	stride = max(len / max_samples, 1.0);
	dP *= stride; dQ *= stride; dk *= stride;
#endif // CONSERVATIVE_MARCHING

	float stepCount = 0.0;
	float pixel_offset = iteration == 0 ? 0.5 : 0.0;
	float prevZMaxEstimate = (Q0.z) / (dk * pixel_offset + k0);  
	float rayZMax = prevZMaxEstimate;
	float rayZMin = prevZMaxEstimate;
	
	// Slide P from P0 to P1, (now-homogeneous) Q from Q0 to Q1, and k from k0 to k1
	// and move the first intersection to the next pixel instead of the current one
	vec2 P = P0 + dP * pixel_offset; vec3 Q = Q0 + dQ * pixel_offset; float k = k0 + dk * pixel_offset;

	float rnd = 0.0;
#ifndef CONSERVATIVE_MARCHING
	vec2 tP;
#endif // CONSERVATIVE_MARCHING
	
	// march until the end of the steps or until a hit has been found
	for (; 
	P.x * stepDirection <= end && layer < 0 && rayZMax < 0;
	P += dP, Q += dQ, k += dk, stepCount++)
	{	
#ifndef CONSERVATIVE_MARCHING
		// jitter the position if the algorithm moves in steps higher than 1 pixel per iteration
		vec2 seed = vec2(jitter * uniform_progressive_sample  * (stepCount + 1)); 
		rnd = rand1_sin(seed) - 0.5;
		tP = P + dP * rnd.x;
		hitPixel.xy = permute ? tP.yx : tP;
#else
		hitPixel.xy = permute ? P.yx : P;
#endif // CONSERVATIVE_MARCHING
		
        rayZMin = prevZMaxEstimate;
		
        // Compute the value at 1/2 pixel into the future
        rayZMax = (Q.z) / (dk * 0.5 + k);

		// verification check
		// if during traversal towards the far plane we exit it (therefore the z sign is flipped)
		// simply replace the value with the far plane value for comparison
		if (signdz < 0 && rayZMax >= 0) rayZMax = -uniform_near_far[cubeindex].x;
		if (signdz > 0 && rayZMax >= 0) rayZMax = -uniform_near_far[cubeindex].y;

		prevZMaxEstimate = rayZMax;

		if (rayZMin > rayZMax)  swap(rayZMin, rayZMax); 

		// trace the multifragment structure and return its location in the list
		layer = ray_hit_a_buffer_search(ivec2(hitPixel), rayZMin, rayZMax, vec2(THICKNESS), signdz, cubeindex);
    } 

	// in case there is a hit, create a new vertex and return
	if (layer > invalid_result)
	{
		result = ABUFFER_FACE_HIT;
		new_vertex = createVertex(vec3(hitPixel, layer), cubeindex);
	}
	else
	{
		hitPixel = permute ? P.yx : P;
		vec3 pecs = vec3(Q * (1.0 / k));
		float pecs_pndcZ = projectZ(pecs.z, cubeindex);
		// if there is no hit we need to check if we exited any of the surrounding frustum planes
		// EXCEPT the far plane (pecs_pndcZ >= 1.0), in which case there is no hit.
		// In that case, continue to the next face
		
		// exit the far plane
		if (pecs_pndcZ >= 1.0)
		{
			result = ABUFFER_FACE_NO_HIT_EXIT;
		}
		// exit the near plane
		else if (pecs_pndcZ <= 0)
		{
			new_hitpoint = pecs + csDirection * uniform_near_far[cubeindex].x * 1.1;
			result = ABUFFER_FACE_NO_HIT_CONTINUE_NEAR_PLANE;
		}
		// exit via the viewport
		else if (alpha < 1.0
#ifndef CONSERVATIVE_MARCHING
		&& P.x * stepDirection > end
#endif // CONSERVATIVE_MARCHING
		)
		{			
			// we are clipping against half pixel boundaries, therefore some rays might not exit the viewport as expected. 
			// Ensure that the ray will be outside the current viewport (therefore inside the next viewport) 
			// by moving the ray origin outside the current viewport
			// reset to the original values
			float _k1 = 1.0 / H1.w;
			vec3 _Q1 = csEndPoint * _k1;
			vec2 _P1 = H1.xy * _k1;
			offset = 0.5;
			// set the viewport to clip half a pixel outside the current boundaries
			vec4 viewport = vec4(-offset, -offset, buffer_size.x + offset, buffer_size.y + offset);
			int vp = -1;
			alpha = clipViewport(hitPixel, _P1, viewport, vp);
			hitPixel = mix(hitPixel, _P1, alpha); _k1 = mix(k, _k1, alpha); _Q1 = mix(Q, _Q1, alpha);
			pecs = vec3(_Q1 / _k1);

			new_hitpoint = pecs;
			result = alpha < 1.0 ? ABUFFER_FACE_NO_HIT_CONTINUE_VIEWPORT : ABUFFER_FACE_NO_HIT_EXIT;
			float pecs_pndcZ = projectZ(pecs.z, cubeindex); 
			if (pecs_pndcZ <= 0)
			{
				new_hitpoint = pecs + csDirection * uniform_near_far[cubeindex].x * 1;
				result = ABUFFER_FACE_NO_HIT_CONTINUE_NEAR_PLANE;
			}
		}
	}

	return result;
}

// this struct avoid iterating through faces we have already looked at
// in order to avoid unnecessary transformations
struct FACE{bool used;};
FACE faces[MAX_FACE_LAYERS];

// Trace a ray in the multiview structure based on a start position and a direction.
// Returns true if a hit is found and the newly created vertex is stored in the out new_vertex parameter 
// The algorithm operates in eye space coordinates
// parameters:
// - csOrigin, the ray origin
// - csDirection, the ray direction
// - buffer_size, the XY size of the current view. 
// - jitter, a jitter offset applied to the start position
// - cubeindex, the current view's face index. This is required for retrieving the appropriate view-projection matrices of each view
// - new_vertex, the created vertex in case of a hit
//
bool traceScreenSpaceRay_abuffer
   (vec3        csOrigin, 
    vec3        csDirection,
	float		jitter,
	int			cubeindex,
	out int		result,
    out Vertex  new_vertex) 
	{		
		ivec2 buffer_size = ivec2(uniform_viewports[cubeindex]);
		// each vertex stores its position in the primary ECS
		// convert it to the required face's ECS
		csOrigin = vec3(uniform_view[cubeindex] * uniform_view_inverse[0] * vec4(csOrigin, 1)).xyz;
		csDirection = vec3(uniform_view[cubeindex] * uniform_view_inverse[0] * vec4(csDirection, 0)).xyz;

		// initialize default parameters
		vec3 new_hitpoint = vec3(0);
		int counter = 0;
#ifndef UNLIMITED_RAY_DISTANCE
		float remaining_distance = RAY_DISTANCE;
#endif // UNLIMITED_RAY_DISTANCE
		int viewport_exit = VIEWPORT_NO_EXIT;
		result = ABUFFER_FACE_NO_HIT_CONTINUE_VIEWPORT;
		bool has_hit = false;

		for (int i = 0; i < MAX_FACE_LAYERS; ++i)
			faces[i].used = false;

		while (result > ABUFFER_FACE_HIT && counter < MAX_FACE_LAYERS
#ifndef UNLIMITED_RAY_DISTANCE
		 && remaining_distance > 0
#endif // UNLIMITED_RAY_DISTANCE
		)
		{
			// trace that face
			result = traceScreenSpaceRay_abuffer_cube(csOrigin, csDirection, counter,
#ifndef UNLIMITED_RAY_DISTANCE
				remaining_distance,
#endif // UNLIMITED_RAY_DISTANCE			
				buffer_size, jitter, cubeindex, viewport_exit, new_hitpoint, new_vertex);

			// find new face
			if (result == ABUFFER_FACE_HIT || result == ABUFFER_FACE_NO_HIT_EXIT)
				break;

			faces[cubeindex].used = true;
			int new_cube_index = 0;

			// if we have exited the viewport, select a new face based on the clipped viewport edges
			result = ABUFFER_FACE_NO_HIT_EXIT;
			if (viewport_exit != VIEWPORT_NO_EXIT)
			{
				new_cube_index = uniform_viewport_edges[cubeindex][viewport_exit];
				// this is always resolves to the same result and is only here for debug purposes
				// as MAX_FACE_LAYERS is either 1 or 7
				if (new_cube_index < MAX_FACE_LAYERS)
				{
					mat4x4 transform = uniform_view[new_cube_index] * uniform_view_inverse[cubeindex];
					csOrigin = vec3(transform * vec4(new_hitpoint, 1)).xyz;
					csDirection = vec3(transform * vec4(csDirection, 0)).xyz;
					buffer_size = ivec2(uniform_viewports[new_cube_index]);
					result = ABUFFER_FACE_NO_HIT_CONTINUE_VIEWPORT;
					cubeindex = new_cube_index;
				}
			}
			// otherwise (the ray hit the near plane) go through all the faces and check where the new point resides
			else
			{
				bool outside_frustum = true;
				for (int i = ABC_SINGLE_VIEW_FULL_RES; i < MAX_FACE_LAYERS && outside_frustum == true; ++i)
				{
					// do not look at the same face
					//if (i == cubeindex) continue;
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
						result = ABUFFER_FACE_NO_HIT_CONTINUE_NEAR_PLANE;
					}
				}
			}
			++counter;
		}	
		return result == ABUFFER_FACE_HIT;
	}

//------------------------------------------------------------ TRACING END