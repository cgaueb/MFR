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
// [Iter][S2] -> 2nd Pass (Screen-space) executed once.
//-----------------------------------------------------------------------------------------------

#include "define.h"
#include "s-buffer.h"

// Input Variables
layout(binding = 0, r32ui)  readonly  uniform uimage2DRect  in_image_counter;
layout(binding = 1, r32ui)  writeonly uniform uimage2DRect  in_image_head;
layout(binding = 3, std430)	coherent  buffer  ADDRESS_MAP {uint next_address[];};

void main(void)
{
	// Get total fragment count in this pixel
	uint count = imageLoad(in_image_counter, ivec2(gl_FragCoord.xy)).x;
	if(count == 0U)
		discard;

	// Compute prefix sum of counters per pixel tile
	int  hash_id = hashFunction(ivec2(gl_FragCoord.xy));
	uint address = atomicAdd(next_address[hash_id], count);

	// Set head address for this pixel
	imageStore(in_image_head, ivec2(gl_FragCoord.xy), uvec4(address, 0U, 0U, 0U) );
}