// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou

#version 440 core
#include "data_structs.h"
#include "sort.h"

// head pointers
layout(binding = 0, r32ui)		coherent uniform uimage2D	    image_head;
// Data buffer
layout(binding = 1, std430)		coherent buffer  LL_DATA	 { NodeTypeData	data []; };
// ID buffer
layout(binding = 2, std430)		coherent buffer  LL_NODES	 { NodeTypeLL	nodes[]; };

uint getPixelHeadID  (				) { return	imageLoad (image_head, ivec2(gl_FragCoord.xy)).x; }
void setPixelHeadID				(const uint val					  ) { imageStore(image_head, ivec2(gl_FragCoord.xy), uvec4(val,0u,0u,0u));}
	
void main(void)
{
	uint init_index = getPixelHeadID();
	if (init_index == 0U) continue;
	
	// 1. LOAD
	int  counter=0;
	uint index = init_index;
	while(index != 0U && counter < ABUFFER_GLOBAL_SIZE)
	{
		fragments_id[counter] = index;
		fragments_depth[counter] = nodes[index].depth;
		index	= nodes[index].next;
		counter++;
	}

	// 2. SORT
	sort(counter);

	// 3. HEAD
	setPixelHeadID(fragments_id[0]);
	
	// 4. NEXT
	for(int i=0; i<counter-1; i++)
		nodes[fragments_id[i]].next = fragments_id[i+1];
	nodes[fragments_id[counter-1]].next = 0U;
}