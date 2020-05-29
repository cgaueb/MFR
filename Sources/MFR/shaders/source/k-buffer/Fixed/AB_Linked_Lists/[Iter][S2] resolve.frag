//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "A-buffer using Linked-Lists" method as described in 
// "Salvi et al., Adaptive Transparency, HPG, 2011".
//
// [Iter][S2] -> 2nd Pass (Screen-space) executed once.
//-----------------------------------------------------------------------------------------------

#include "define.h"
#include "data_structs.h"
#include "sort.h"

// Input Variables
uniform int layer;
layout(binding = 0, r32ui)	readonly uniform uimage2DRect in_image_head;
layout(binding = 1, std430) readonly buffer LinkedLists { NodeTypeLL nodes[]; };

// Output Variables
layout(location = 0, index = 0) out vec4 out_frag_color;

void main(void)
{
	// Get head pixel pointer
	uint index = imageLoad(in_image_head, ivec2(gl_FragCoord.xy)).x;
	if(index == 0u)
		discard;

	// Create an empty k-buffer
	vec2 k[KB_SIZE];
	for(int i=0; i<KB_SIZE; i++)
		k[i] = vec2(0.0f, 1.0f);

	// Perform insertion sort for each incoming fragment
	while(index != 0U)
	{
		vec2 temp, value = vec2(uintBitsToFloat(nodes[index].color), nodes[index].depth);
		for(int i=0; i<KB_SIZE; i++)
			if(value.g <= k[i].g)
			{
				temp    = value;
				value   = k[i].rg;
				k[i].rg = temp;
			}

		index = nodes[index].next;
	}
	
	// Return the color value of the selected fragment
   	out_frag_color = unpackUnorm4x8(floatBitsToUint(k[layer].r));
}