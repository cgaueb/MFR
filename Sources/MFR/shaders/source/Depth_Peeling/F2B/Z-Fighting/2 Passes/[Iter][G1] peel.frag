//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "Z-fighting-free Front-to-back Depth Peeling (with 2 geometry passes)" 
// method as described in "Vasilakis and Fudos, Depth-Fighting Aware Methods for Multifragment
// Rendering, TVCG, 2013".
//
// [Iter][G1] -> 1st Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
layout(binding = 0) uniform sampler2DRect in_tex_depth;
layout(binding = 1) uniform sampler2DRect in_tex_count;
layout(binding = 2) uniform sampler2DRect in_tex_id;

// Output Variables
layout(location = 0, index = 0) out  vec4 out_frag_depth;
layout(location = 1, index = 0) out  vec4 out_frag_color_front;
layout(location = 2, index = 0) out  vec4 out_frag_color_back;

void main(void)
{
	// Discard previously extracted fragments, producing the next nearest layer underneath
	float depth = -texture(in_tex_depth, gl_FragCoord.xy).r;
	if (gl_FragCoord.z < depth)
		discard;

	// Get the (non-peeled) coplanar fragments IDs and size
	ivec3 countIDs 		 = ivec3(texture(in_tex_id, gl_FragCoord.xy).rg, texture(in_tex_count, gl_FragCoord.xy).r);

	// Initialize output buffers
	out_frag_color_front = vec4(0.0f);
	out_frag_color_back  = vec4(0.0f);

	// Move to the next depth layer underneath or keep peeling at the current layer
	out_frag_depth.r	 = ( countIDs.z > 2 || gl_FragCoord.z != depth) ? -gl_FragCoord.z : -1.0f;
	
	// Compute shading for the fragment that has ID equal
	// to the one of the values of the min-max ID buffer
	vec4 color = computePixelColor();
	if		(-countIDs.x == gl_PrimitiveID) out_frag_color_front = color;
	else if ( countIDs.y == gl_PrimitiveID) out_frag_color_back  = color;
}