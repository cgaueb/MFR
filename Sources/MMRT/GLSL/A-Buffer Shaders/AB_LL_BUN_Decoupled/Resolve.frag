// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou

#define BUCKET_SIZE				__BUCKET_SIZE__

#version 440 core
#include "data_structs.h"
#include "sort.h"

// head pointers
layout(binding = 0, r32ui)		coherent uniform uimage2DArray	image_head;
// Data buffer
layout(binding = 2, std430)		coherent buffer  LL_DATA	 { NodeTypeData	data []; };
// ID buffer
layout(binding = 3, std430)		coherent buffer  LL_NODES	 { NodeTypeLL	nodes[]; };

void setPixelHeadID	(const int  b, const uint val) {		imageStore(image_head, ivec3(gl_FragCoord.xy, b), uvec4(val,0u,0u,0u));}
uint getPixelHeadID	(const int  b				 ) { return imageLoad (image_head, ivec3(gl_FragCoord.xy, b)).r;}

void main(void)
{
	for (int b=0; b<BUCKET_SIZE; b++)
	{
		uint init_index = getPixelHeadID(b);
		if(init_index == 0U) continue;
		
		// 1. LOAD
		int  counterLocal = 0;
		uint index = init_index;
		while(index != 0U && counterLocal < ABUFFER_GLOBAL_SIZE)
		{
			fragments_id[counterLocal] = index;
			fragments_depth[counterLocal] = nodes[index].depth;
			index	= nodes[index].next;
			counterLocal++;
		}

		// 2. SORT
		sort(counterLocal);
		
		// 3. HEAD
		setPixelHeadID(fragments_id[0]);
		
		// 4. NEXT
		for(int i=0; i<counterLocal-1; i++)
			nodes[fragments_id[i]].next = fragments_id[i+1];
		nodes[fragments_id[counterLocal-1]].next = 0U;
	}
}