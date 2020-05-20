//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "Z-fighting-free Front-to-back Depth Peeling (with A-buffer, Fixed Array)" 
// method as described in "Vasilakis and Fudos, Depth-Fighting Aware Methods for Multifragment
// Rendering, TVCG, 2013".
//
// [Iter][S3] -> 3rd Pass (Screen-space) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
uniform int   coplanar_fragment;

layout(binding = 0, r32ui ) readonly uniform uimage2DRect	 in_image_counter;
layout(binding = 1, rgba8 ) readonly uniform image2DArray	 in_image_peel_color;

// Output Variables
layout(location = 0, index = 0) out  vec4 out_frag_color;

void main(void)
{
	// Get fragment coplanarity length in current depth layer
	int count = int(imageLoad(in_image_counter, ivec2(gl_FragCoord.xy)).r);
	if(count == 0)
		discard;

	// Return the color value of the specific coplanar fragment
	out_frag_color   = imageLoad(in_image_peel_color, ivec3(ivec2(gl_FragCoord.xy), coplanar_fragment));
}
