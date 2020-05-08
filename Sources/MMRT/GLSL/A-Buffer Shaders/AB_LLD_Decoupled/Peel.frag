// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou

#version 440 core
#include "data_structs.h"

in float pecsZ;

layout(binding = 0, r32ui)		coherent uniform uimage2DArray image_pointers;
layout(binding = 1, std430)		coherent buffer  LL_DATA	 { NodeTypeData			data []; };
layout(binding = 2, std430)		coherent buffer  LLD_NODES	 { NodeTypeLL_Double	nodes[]; };
layout(binding = 3, offset = 0)			 uniform atomic_uint   next_address;

uint exchangePixelHeadID	(const uint val) { return imageAtomicExchange(image_pointers, ivec3(gl_FragCoord.xy, 0), val);}

void main(void)
{	
	// perform any texture fetches here

	uint index = atomicCounterIncrement(next_address) + 1U;
	if (index >= nodes.length()) return;

	nodes[index].depth		= pecsZ;
	nodes[index].next		 = exchangePixelHeadID(index);

	// add shading parameters to Data buffer
	// data[index].albedo	= ...		
}