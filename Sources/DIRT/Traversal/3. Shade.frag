// DIRT: Deferred Image-based Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
// This file contains the fragment implementation for the Shade pass
// The shading buffer contents G[k-1], G[k], G[k+1] are fetched to compute the final illumination for the current path segment

#version 440 core
#include "data_structs.h"

// image bindings
layout(binding = 0, rgba32f)	coherent	uniform image2D			image_operators_probabilities;					// the transport operators texture
layout(binding = 1, r32ui )		readonly 	uniform uimage2D  	 	image_hit_buffer_head;							// the hit buffer head id texture
layout(binding = 2, std430)		coherent 	buffer  LLD_SHADING	 { NodeTypeShading		nodes_shading []; };    	// the shading buffer
layout(binding = 3, std430)		writeonly 	buffer  LLD_HIT		 { NodeTypePeel			nodes_hit[]; };         	// the hit buffer
layout(binding = 4, rgba32f)	coherent	uniform image2D		image_result;										// the final illumination texture

// store and load the texture holding the transport operators-probabilities used for path tracing
void storeOperatorsProbabilities	(const vec4 value)	{ imageStore (image_operators_probabilities, ivec2(gl_FragCoord.xy), value); }
vec4 loadOperatorsProbabilities		(				 )	{ return imageLoad (image_operators_probabilities, ivec2(gl_FragCoord.xy));}

uniform int uniform_first_iteration;																				// the first iteration

// add the color for each path
void store_color(vec3 path_color)
{
	vec4 stored_total_color = vec4(0);
	if (uniform_first_iteration == 0)
		stored_total_color = imageLoad(image_result, ivec2(gl_FragCoord.xy));
	stored_total_color.xyz += path_color.xyz;
	imageStore(image_result, ivec2(gl_FragCoord.xy), vec4(stored_total_color.xyz, 0));
}

void main(void)
{
	uvec2 dimensions = uvec2(uniform_viewports[0]);
	uvec2 frag = uvec2(floor(gl_FragCoord.xy));
	// each 3-point pair is stored sequentially
	int resolve_index = int(frag.y * dimensions.x + frag.x) * 3;
		
	vec3 prev_vertex_position_ecs = vec3(0);	
	vec3 path_color = vec3(0);
	
	// direct pass (if the direct visibility pass is used)
	if (uniform_bounce == 1)
	{
		// write illumination data for direct visibility
	}
	else
	{
		// write illumination data for indirect visibility
	}
	
	// write final color in the image_result
	store_color(path_color);

	// Left shift the shading buffer
	// change the stored current and next to previous and current
	nodes_shading[resolve_index]		= nodes_shading[resolve_index + 1u];
	nodes_shading[resolve_index + 1u]	= nodes_shading[resolve_index + 2u];

	// set the next hit as active
	nodes_shading[resolve_index + 2u].position = vec4(0,0,0,0);
}
