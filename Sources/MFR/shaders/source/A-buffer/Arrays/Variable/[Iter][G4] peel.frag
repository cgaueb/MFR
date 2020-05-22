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
// [Iter][G4] -> 4th Pass (Geometry) executed once.
//-----------------------------------------------------------------------------------------------

#include "define.h"
#include "s-buffer.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
layout(binding = 1, r32ui)  coherent  uniform uimage2DRect in_image_head;
layout(binding = 2, rg32f)  writeonly uniform imageBuffer  in_image_peel_data;
layout(binding = 3, std430)	readonly  buffer  ADDRESS_MAP {uint next_address[];};

void main(void)
{
	// Find next free position in variable array
	uint index   = imageAtomicAdd(in_image_head, ivec2(gl_FragCoord.xy), 1U);
	int  hash_id = hashFunction(ivec2(gl_FragCoord.xy));
	uint sum     = next_address[hash_id] + index;
#if inverse
	index = hash_id < COUNTERS_2d ? sum : imageSize(image_peel) + 1U - sum;
#else
	index = sum;
#endif

	// Compute the shading color of each incoming fragment
	vec4 color   = computePixelColor();
	// Store fragment data [.r:color, .g:depth]
	vec4 data	 = vec4(uintBitsToFloat(packUnorm4x8(color)), gl_FragCoord.z, 0.0f, 0.0f);
	// Store fragment data [.r:color, .g:depth]
	imageStore(in_image_peel_data, int(index), data);
}