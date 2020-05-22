//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "A-buffer using multiple linked lists (one per uniform bucket)" method as
// described in "Vasilakis and Fudos, Depth-Fighting Aware Methods for Multifragment Rendering, 
// TVCG, 2013".
//
// [Iter][S3] -> 3rd Pass (Screen-space) executed once.
//-----------------------------------------------------------------------------------------------

#include "define.h"
#include "data_structs.h"
#include "sort.h"

// Input Variables
uniform int	layer;

layout(binding = 1, r32ui)	readonly uniform uimage2DArray in_image_heads;
layout(binding = 2 std430)  coherent buffer  LinkedLists   { NodeTypeLL nodes[]; };

// Output Variables
layout(location = 0, index = 0) out vec4 out_frag_color;

void main(void)
{
	// Alloc optionally, used for fixing next fragment pointers
	uint fragments_id[LOCAL_SIZE];

	int count_total = 0;
	for (int b=0; b<BUCKET_SIZE; b++)
	{
		// Get head pixel pointer
		uint index = imageLoad(in_image_head, ivec3(gl_FragCoord.xy, b)).x;
		if(index == 0u)
			continue;

		// Store fragment data values to a local array
		int count = 0;
		while (index != 0u)
		{
			fragments_id[count] = index; // Set optionally
			fragments[count++]  = vec2(uintBitsToFloat(nodes[index].color), nodes[index].depth);
			index			    = nodes[index].next;
		}
		count_total += count;
	
		// Sort fragments by their depth
    	sort(count);

		// Use optionally if you want to perform subsequent operations in a following pass
		{
			// Set head pixel pointer
			imageStore(in_image_heads, ivec3(gl_FragCoord.xy, b), uvec4(fragments[0].g, 0.0u, 0.0u, 0.0u));
				
			// Correct fragment connection pointers
			for(int i=0; i<count-1; i++)
				nodes[fragments_id[i]].next = fragments_id[i+1];
			nodes[fragments_id[counter-1]].next = 0U;
		}

		// Return the color value of the selected fragment
		if(layer < count_total)
			out_frag_color = unpackUnorm4x8(floatBitsToUint(fragments[count_total - count + layer].r));
}