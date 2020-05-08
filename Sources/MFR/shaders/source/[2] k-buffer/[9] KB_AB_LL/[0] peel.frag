#include "define.h"
#include "data_structs.h"

	vec4 computePixelColor();

	layout(binding = 0, r32ui)		coherent uniform uimage2DRect  image_next;
	layout(binding = 1, std430)		coherent buffer  LinkedLists   { NodeTypeLL nodes[]; };
	layout(binding = 2, offset = 0)			 uniform atomic_uint   next_address;

	uint exchangePixelCurrentPageID	(const uint val	) { return imageAtomicExchange(image_next, ivec2(gl_FragCoord.xy), val);}

	void main(void)
	{
		uint page_id = atomicCounterIncrement(next_address) + 1U;
		if(	 page_id < nodes.length())
		{
			nodes[page_id].color = packUnorm4x8(computePixelColor());
			nodes[page_id].depth = gl_FragCoord.z;
			nodes[page_id].next  = exchangePixelCurrentPageID(page_id);

			discard;
		}
	}