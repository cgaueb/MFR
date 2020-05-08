#include "define.h"

	uniform int width;

	layout(binding = 0, std430)	writeonly buffer myKbuffer { uint64_t nodes[]; };

	void main(void)
	{
		int index = (int(gl_FragCoord.x) + width*int(gl_FragCoord.y))*HEAP_SIZE;

		uint64_t zero64 = uint64_t(0xFFFFFFFF) << 32;
		for(int i=0; i<HEAP_SIZE; i++)
			nodes[index + i] = zero64;
	}