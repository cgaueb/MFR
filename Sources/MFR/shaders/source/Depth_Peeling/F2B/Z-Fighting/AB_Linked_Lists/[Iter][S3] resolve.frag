//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "Z-fighting-free Front-to-back Depth Peeling (with A-buffer, Linked Lists)" 
// method as described in "Vasilakis and Fudos, Depth-Fighting Aware Methods for Multifragment
// Rendering, TVCG, 2013".
//
// [Iter][S3] -> 3rd Pass (Screen-space) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
uniform int    coplanar_fragment;

layout(binding = 1, rgba8) readonly uniform  imageBuffer in_image_peel_color;
layout(binding = 2, r32ui) readonly uniform uimageBuffer in_image_pointers;
layout(binding = 3, r32ui) readonly uniform uimage2DRect in_image_pixel_head;

// Output Variables
layout(location = 0, index = 0) out  vec4 out_frag_color;

void main(void)
{
	// Get head pixel pointer
	uint index = imageLoad(in_image_pixel_head, ivec2(gl_FragCoord.xy)).x;
	if(index == 0U)
		discard;

	// Move to the specific coplanar fragment
	int  i=0;
	while(index != 0U && i < coplanar_fragment)
		index = imageLoad(in_image_pointers, int(index)).x;
		
	// Return the color value of the specific coplanar fragment
	out_frag_color = imageLoad(in_image_peel_color, int(index));
}