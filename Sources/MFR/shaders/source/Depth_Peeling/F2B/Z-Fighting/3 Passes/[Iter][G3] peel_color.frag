//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "Z-fighting-free Front-to-back Depth Peeling (with 3 geometry passes)" 
// method as described in "Vasilakis and Fudos, Depth-Fighting Aware Methods for Multifragment
// Rendering, TVCG, 2013".
//
// [Iter][G3] -> 3rd Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
layout(binding = 0) uniform 	sampler2DRect in_tex_id;

// Output Variables
layout(location = 0, index = 0) out  vec4 	  out_frag_color_front;
layout(location = 1, index = 0) out  vec4 	  out_frag_color_back;

layout (early_fragment_tests) in;

void main(void)
{
	// Get the (non-peeled) coplanar fragments IDs
	ivec2 IDs = ivec2(texture(in_tex_id, gl_FragCoord.xy).rg);
	
	// Compute shading for the fragment that has ID equal
	// to the one of the values of the min-max ID buffer
	vec4 color = computePixelColor();
	if		(-IDs.x == gl_PrimitiveID ) out_frag_color_front = color;
	else if ( IDs.y == gl_PrimitiveID )	out_frag_color_back  = color;
	else
		discard;
}