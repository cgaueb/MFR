// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou

#version 440 core
#include "data_structs.h"
#include "s-buffer.h"

in float pecsZ;

layout(binding = 1, r32ui	) coherent  uniform  uimage2D	  image_head;
layout(binding = 2, std430	) writeonly buffer   SB_DATA	 { NodeTypeData data  []; };
layout(binding = 3, std430	) writeonly buffer   SB_NODES	 { NodeTypeSB   nodes []; };
layout(binding = 4, std430  ) readonly  buffer   ADDRESS_MAP { uint head_s[]; };

uint addPixelHeadAddress(									  ) { return	imageAtomicAdd	(image_head, ivec2(gl_FragCoord.xy), 1U);}

void main(void)
{	
	uint  page_id = addPixelHeadAddress();
	int   hash_id = hashFunction(ivec2(gl_FragCoord.xy))+COUNTERS;
	uint  sum     = head_s[hash_id] + page_id;

#if inverse
	uint  index = hash_id < COUNTERS_2d ? sum : nodes.length() + 1U - sum;
#else
	uint  index = sum;
#endif

	nodes[index].depth		= pecsZ;

	// perform any texture fetches here
	// add shading parameters to Data buffer
	// data[index].albedo	= ...
}