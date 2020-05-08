#include "define.h"
#include "sort.h"
#include "resolve.h"

	uniform int	width;

	layout(binding  = 0, std430) readonly buffer myKbuffer { uint64_t nodes[]; };

	layout(location = 0, index = 0) out vec4 out_frag_color;

	void main(void)
	{
		int index = (int(gl_FragCoord.x) + width*int(gl_FragCoord.y))*HEAP_SIZE;

		int counter=0;
		for(int i=0; i<HEAP_SIZE; i++)
		{
			uvec2 peel = unpackUint2x32(nodes[index + i]);
			if(peel.g >= 0xFFFFFFFFU)
					break;
			fragments[counter++] = vec2(uintBitsToFloat(peel.r), uintBitsToFloat(peel.g));
		}

		if(counter > 0)
			out_frag_color = resolve(counter, true);
		else
			discard;
	}
