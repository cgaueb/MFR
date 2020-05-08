// DIRT: Deferred Image-based Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
// This file contains the fragment implementation for the Fill Depth pass
// Incoming primitives are clipped and stored in the depth buffer texture
// The near value is stored with reverse sign to make the mipmap calculations simpler
// Note: This pass requires conservative rasterization otherwise oblique primitives might not be rasterized

#version 440 core
#define NUM_CUBEMAPS __NUM_FACES__
#include "clip.glsl"

uniform mat4	uniform_view_array[NUM_CUBEMAPS]; 				// world->eye transformation for all views
uniform vec2	uniform_near_far[NUM_CUBEMAPS]; 				// near far clipping distance for all views
uniform vec4	uniform_viewports[NUM_CUBEMAPS]; 				// viewport for all views
uniform vec3	uniform_plane_points_wcs[NUM_CUBEMAPS * 8]; 	// world space position of the frustum corners for all views

flat in int cube_index;											// the view index from the geometry shader
flat in vec4 prim_vertex_wcs[3]; 								// the incoming vertex positions from the geometry shader

layout(location = 0) out vec2 out_frag_depth_bounds; 			// the depth bounds texture

void main(void)
{
	vec3 p1 = prim_vertex_wcs[0].xyz;
	vec3 p2 = prim_vertex_wcs[1].xyz;
	vec3 p3 = prim_vertex_wcs[2].xyz;
	// clip the primitive against the frustum boundaries
	vec2 bounds = clip(cube_index, p1, p2, p3, 0);	
	out_frag_depth_bounds = vec2(-bounds.x, bounds.y);
}
