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
// [Iter][G2] -> 2nd Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
uniform int  width_2;
uniform uint total_fragments;
layout(binding = 0, offset = 0)		 uniform atomic_uint  in_next_address;

// Output Variables
layout(binding = 1, r32ui) coherent  uniform uimageBuffer out_image_pointers;
layout(binding = 2, rg32f) coherent	 uniform  imageBuffer out_image_peel_data;

void main(void)
{
	// Get the next available location in the global buffer
	uint index = atomicCounterIncrement(in_next_address);
	if(index < imageSize(out_image_peel_data))
	{
		// Compute the packed shading color of each incoming fragment
		float color	= uintBitsToFloat(packUnorm4x8(computePixelColor()));

		// Prev Position
		uint headIndex = uint(gl_FragCoord.x + width_2*gl_FragCoord.y) * 2U + 2U;
		uint prevIndex = headIndex;

		// Enter critical section
		int	 iter  = 0;
		int  count = 0;
		while(iter < MAX_ITERATIONS)
		{
			// Get next position
			uint nextIndex = imageLoad(out_image_pointers, int(prevIndex)).r;
			if(nextIndex == 0U)
				break;

			// Store incoming fragment if has depth less that the one in the linked list
			if(gl_FragCoord.z < imageLoad(out_image_peel_data, int(nextIndex)).g)
			{	
				// 1. [NEW]  --> [NEXT]
				imageStore(out_image_pointers, int(index), uvec4(nextIndex,0U,0U,0U));
				if(iter == 0)
					imageStore(out_image_peel_data, int(index), vec4(color, gl_FragCoord.z, 0.0f, 0.0f));
				// 2. [PREV] --> [NEW]
				if(nextIndex == imageAtomicCompSwap(out_image_pointers, int(prevIndex), nextIndex, index))
					break;  // 3. [SUCCESS] 
				else
					++iter; // 3. [RETRY]
			}
			// Move to the next fragment in the linked list
			else
			{
				if(++count == KB_SIZE)
					break;
				prevIndex = nextIndex;
			}
		}

		// Used for memory counting of overflowed fragments
		discard;
	}
}