// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou

#version 440 core
#include "data_structs.h"
in float pecsZ;

layout(binding = 0, r32ui)		coherent uniform uimage2D	    image_head;
layout(binding = 2, std430)	  	writeonly buffer  LINKED_LISTS { NodeTypeDataLL nodes[]; };
layout(binding = 3, offset = 0)	uniform atomic_uint    next_address;

uint exchangePixelHeadID	(const uint  val	) { return imageAtomicExchange(image_head	, ivec2(gl_FragCoord.xy), val);}

void main(void)
{
	// perform any texture fetches here

	uint index = atomicCounterIncrement(next_address) + 1U;
	if (index >= nodes.length()) return;

	nodes[index].depth		= pecsZ;
	nodes[index].next		= exchangePixelHeadID(index);

	// add shading parameters to buffer
	// nodes[index].albedo	= ...
}