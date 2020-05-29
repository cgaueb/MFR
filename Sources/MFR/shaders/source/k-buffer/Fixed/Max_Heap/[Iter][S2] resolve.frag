//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "k+-buffer (max array)" method as described in 
// "Vasilakis, Fudos, k+-buffer: Fragment Synchronized k-buffer, I3D, 2014".
//
// [Iter][S3] -> 3rd Pass (Screen-space) executed optionally in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"
#include "sort.h"

// Input Variables
int layer;
layout(binding = 0, r32ui) readonly uniform uimage2DRect  in_image_counter;
layout(binding = 1, rg32f) readonly uniform  image2DArray in_image_peel_data;

// Output Variables
layout(location = 0, index = 0) out vec4 out_frag_color;

void main(void)
{
	// Get pixel fragments counter
	int count = int(imageLoad(in_image_counter, ivec2(gl_FragCoord.xy)).r);
	if(count == 0)
		discard;

	// Store fragment data values to a local array
	for(int i=0; i<KB_SIZE; i++)
		fragments[i] = imageLoad(in_image_peel_data, ivec3(gl_FragCoord.xy, i)).rg;

	// Sort fragments by their depth
	sort(count);

	// Return the color value of the selected fragment
   	out_frag_color = unpackUnorm4x8(floatBitsToUint(fragments[layer].r));
}