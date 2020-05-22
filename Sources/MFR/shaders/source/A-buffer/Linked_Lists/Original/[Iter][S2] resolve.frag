//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "A-buffer using Linked-Lists" method as described in 
// "Yang et al., Real-time concurrent linked list construction on the GPU, CGF (EGSR'10), 2010".
//
// [Iter][S2] -> 2nd Pass (Screen-space) executed once.
//-----------------------------------------------------------------------------------------------

#include "define.h"
#include "data_structs.h"
#include "sort.h"

// Input Variables
uniform int	layer;

layout(binding = 0, r32ui)	readonly uniform uimage2DRect in_image_head;
layout(binding = 1 std430)  coherent buffer  LinkedLists  { NodeTypeLL nodes[]; };

// Output Variables
layout(location = 0, index = 0) out vec4 out_frag_color;

void main(void)
{
	// Get head pixel pointer
	uint index = imageLoad(in_image_head, ivec2(gl_FragCoord.xy)).x;
	if(index == 0u)
		discard;

	// Alloc optionally, used for fixing next fragment pointers
	uint fragments_id[LOCAL_SIZE];

	// Store fragment data values to a local array
	int count = 0;
	while (index != 0u)
	{
		fragments_id[count] = index; // Set optionally
		fragments[count++]  = vec2(uintBitsToFloat(nodes[index].color), nodes[index].depth);
		index			    = nodes[index].next;
	}
	
	// Sort fragments by their depth
    sort(count);

	// Use optionally if you want to perform subsequent operations in a following pass
	{
		// Set head pixel pointer
		imageStore(in_image_head, ivec2(gl_FragCoord.xy), uvec4(fragments[0].g, 0.0u, 0.0u, 0.0u));
			
		// Correct fragment connection pointers
		for(int i=0; i<count-1; i++)
			nodes[fragments_id[i]].next = fragments_id[i+1];
		nodes[fragments_id[counter-1]].next = 0U;
	}

	// Return the color value of the selected fragment
   	out_frag_color = unpackUnorm4x8(floatBitsToUint(fragments[layer].r));
}