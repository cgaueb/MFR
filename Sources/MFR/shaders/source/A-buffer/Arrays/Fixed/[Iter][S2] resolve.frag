//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "A-buffer using Fixed Arrays" method as described in 
// "Crassin, Fast and accurate single-pass A-buffer, Blog post, 2010".
//
// [Iter][S2] -> 2nd Pass (Screen-space) executed once.
//-----------------------------------------------------------------------------------------------

#include "define.h"
#include "sort.h"

// Input Variables
uniform int	layer;

layout(binding = 0, r32ui) readonly uniform uimage2DRect	in_image_counter;
layout(binding = 1, rg32f) readonly uniform  image2DArray	in_image_peel_data;

// Output Variables
layout(location = 0, index = 0) out  vec4 out_frag_color;

void main(void)
{
	// Get total fragment count in this pixel
	int count = imageLoad(image_counter, ivec2(gl_FragCoord.xy)).x;
	if(count == 0)
		discard;

	// Store fragment data values to a local array
	for(int i=0; i<count; i++) // Note that 'count' should always be less than 'LOCAL_SIZE'
		fragments[i] = imageLoad(image_peel_data, ivec3(gl_FragCoord.xy, i)).rg;

	// Sort fragments by their depth
    sort(count);

	// Return the color value of the selected fragment
   	out_frag_color = unpackUnorm4x8(floatBitsToUint(fragments[layer].r));
}