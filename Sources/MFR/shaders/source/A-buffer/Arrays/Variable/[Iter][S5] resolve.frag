//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "A-buffer using Variable Arrays" method as described in 
// "Vasilakis and Fudos, S-buffer: Sparsity-aware multifragment rendering, EG (Short Papers), 2012".
//
// [Iter][S5] -> 5th Pass (Screen-space) executed once.
//-----------------------------------------------------------------------------------------------

#include "define.h"
#include "s-buffer.h"
#include "sort.h"

// Input Variables
uniform int	  layer;

layout(binding = 0, r32ui)  readonly  uniform uimage2DRect in_image_counter;
layout(binding = 1, r32ui)  readonly  uniform uimage2DRect in_image_head;
layout(binding = 2, rg32f)  readonly  uniform imageBuffer  in_image_peel;
layout(binding = 3, std430)	readonly  buffer  ADDRESS_MAP  {uint next_address[];};

// Output Variables
layout(location = 0, index = 0) out vec4 out_frag_color;

void main(void)
{
	// Get total fragment count in this pixel
	int count = int(imageLoad (in_image_counter, ivec2(gl_FragCoord.xy)).x;
	if(count == 0)
		discard;

	// Compute head pixel pointer
	uint address = imageLoad(in_image_head, ivec2(gl_FragCoord.xy)).x-1U;
	int  hash_id = hashFunction(ivec2(gl_FragCoord.xy));
#if inverse	
	bool front_prefix = hash_id < COUNTERS_2d ? true : false;
#else
	bool front_prefix = true;
#endif
	uint sum 		= next_address[hash_id];
	uint index 		= front_prefix ? address + sum : imageSize(image_peel) + 1U - address - sum;
	uint direction  = front_prefix ? -1U : 1U;

	// Store fragment data values to a local array
	for(int i=0; i<counter; i++)
	{
		fragments[i] = imageLoad (image_peel, int(index)).rg;
		index		+= direction;
	}

	// Sort fragments by their depth
    sort(count);

	// Return the color value of the selected fragment
   	out_frag_color = unpackUnorm4x8(floatBitsToUint(fragments[layer].r));
}