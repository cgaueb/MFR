// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou

#version 440 core
#include "sort_define.h"
#include "data_structs.h"
#include "s-buffer.h"
#include "sort4.h"

layout(binding = 0, r32ui ) readonly  uniform uimage2D		image_counter;
layout(binding = 1, r32ui ) readonly  uniform uimage2D		image_head;
layout(binding = 2, std430) coherent  buffer  SBUFFER		{ NodeTypeDataSB nodes []; };
layout(binding = 3, std430)	readonly  buffer  ADDRESS_MAP 	{ uint head_s[]; };

uint getPixelHeadAddress() {return imageLoad (image_head	, ivec2(gl_FragCoord.xy)).x-1U;}
uint getPixelFragCounter() {return imageLoad (image_counter	, ivec2(gl_FragCoord.xy)).x;   }

void main(void)
{
	int counter = int(getPixelFragCounter());
	if(counter == 0) return;
	
	// 1. LOAD
	uint address = getPixelHeadAddress();
	int  hash_id = hashFunction(ivec2(gl_FragCoord.xy));

#if inverse	
	bool front_prefix = hash_id < COUNTERS_2d ? true : false;
#else
	bool front_prefix = true;
#endif
	uint sum = head_s[hash_id+COUNTERS];

	uint init_page_id = front_prefix ? address + sum : nodes.length() + 1U - address - sum;
	uint direction    = front_prefix ? -1U : 1U;	
	
	uint page_id	  = init_page_id;
	for(uint i=0; i<counter; i++)
	{
		// example data structure
		fragments[i] = vec4(
		//nodes[index].albedo, 
		nodes[index].depth, 
		//..., 
		//...
		);
		page_id += direction;
	}

	// 2. SORT
	sort(counter);
	
	// 3. DATA POINTERS
	page_id	  = init_page_id;
	for(uint i=0; i<counter; i++)
	{
		nodes[index].depth		= fragments[i].g;
		//nodes[index].albedo	= ...
		page_id += direction;
	}
}