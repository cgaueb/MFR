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
// [Iter][G2] -> 2nd Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables	
layout(binding = 0, offset = 0)		 uniform  atomic_uint next_address;
layout(binding = 1, rgba8) writeonly uniform  imageBuffer in_image_peel_color;
layout(binding = 2, r32ui) writeonly uniform uimageBuffer in_image_pointers;
layout(binding = 3, r32ui) coherent  uniform uimage2DRect in_image_pixel_head;

layout (early_fragment_tests) in;

void main(void)
{
	// Compute the shading color of each coplanar fragment
	vec4  color = computePixelColor();
	// Get the next available buffer location
	int  index = int(atomicCounterIncrement(next_address));
	// Get the pixel head index and replace it with the incoming fragment index
	uint head  = imageAtomicExchange(in_image_pixel_id, ivec2(gl_FragCoord.xy), index);
	// Connect these fragments
	imageStore(in_image_pointers, index, uvec4(head, 0U, 0U, 0U) );
	// Store fragment color
	imageStore(in_image_peel_color, index, color);
}