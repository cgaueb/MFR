//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "A-buffer using Double Linked-Lists" method as described in 
// "Vardis et al., A Multiview and Multilayer Approach for Interactive Ray Tracing, I3D, 2016".
//
// [Iter][G1] -> 1st Pass (Geometry) executed once.
//-----------------------------------------------------------------------------------------------

#include "define.h"
#include "data_structs.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
layout(binding = 0, r32ui)		coherent uniform uimage2DArray 		in_image_head_tail;
layout(binding = 1, std430)		coherent buffer  DoubleLinkedLists  { NodeTypeDLL nodes[]; };
layout(binding = 2, offset = 0)			 uniform atomic_uint   		in_next_address;

void main(void)
{
	// Get the next available location in the global buffer
	uint index = atomicCounterIncrement(in_next_address) + 1U;
	
	// Check for memory overflow
	if(	 index < nodes.length())
	{
		// Compute the shading color of each incoming fragment
		vec4 color = computePixelColor();

		// Store fragment data into the global buffer
		nodes[index].color = packUnorm4x8(color);
		nodes[index].depth = gl_FragCoord.z;
		// Connect fragment with head of the fragment list and then set it as the new head
		nodes[index].next  = imageAtomicExchange(in_image_head_tail, ivec3(gl_FragCoord.xy, 0), index);
		// Prev pointer will be set after sorting 
		nodes[index].prev  = 0u;

		// Used for memory counting of overflowed fragments
		discard;
	}
}