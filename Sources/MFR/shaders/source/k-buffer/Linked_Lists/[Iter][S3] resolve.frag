//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "k-buffer using Linked-Lists" method as described in 
// "Yu et al., A Framework for Rendering Complex Scattering Effects on Hair, I3D, 2012".
//
// [Iter][S3] -> 3rd Pass (Screen-space) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
uniform int layer;
uniform int width_2;
layout(binding = 1, r32ui) readonly uniform uimageBuffer in_image_pointers;
layout(binding = 2, rg32f) readonly uniform  imageBuffer in_image_peel_data;

// Output Variables
layout(location = 0, index = 0) out vec4 out_frag_color;

void main(void)
{	
	// get head pointer
	uint index  = uint(gl_FragCoord.x + width_2*gl_FragCoord.y) * 2U + 2U;
	// start from the second fragment in the linked list
	index		= imageLoad(in_image_pointers, int(index)).r;

	// Store fragment data values to a local array
	int count 	= 0;
	vec2 k[KB_SIZE];
	for(int i=0; i<KB_SIZE; i++)
	{
		vec2 data = imageLoad(in_image_peel_data, int(index)).rg;
		if (data.g == 1.0f)
			break;

		k[count++] = data;
		index  = imageLoad(in_image_pointers, int(index)).r;
	}

	// Return the color value of the selected fragment
   	out_frag_color = unpackUnorm4x8(floatBitsToUint(k[layer].r));
}