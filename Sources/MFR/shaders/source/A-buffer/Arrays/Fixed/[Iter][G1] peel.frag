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
// [Iter][G1] -> 1st Pass (Geometry) executed once.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
layout(binding = 0, r32ui) coherent  uniform uimage2DRect	 in_image_counter;
layout(binding = 1, rg32f) writeonly uniform  image2DArray	 in_image_peel_data;

void main(void)
{
	// Increment coplanarity size and get the next array location
	int  index = int(imageAtomicAdd(in_image_counter, ivec2(gl_FragCoord.xy), 1u));	
	// Compute the shading color of each incoming fragment
	vec4 color = computePixelColor();	
	// Store fragment data [.r:color, .g:depth]
	vec4 data	= vec4(uintBitsToFloat(packUnorm4x8(color)), gl_FragCoord.z, 0.0f, 0.0f);
	imageStore(in_image_peel_data, ivec3(gl_FragCoord.xy, index), data);
}