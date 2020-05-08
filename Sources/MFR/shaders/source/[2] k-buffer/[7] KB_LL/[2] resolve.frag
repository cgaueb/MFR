#include "define.h"
#include "sort.h"
#include "resolve.h"

	uniform int width_2;
	
	layout(binding = 1, r32ui) readonly uniform uimageBuffer image_pointers;
	layout(binding = 2, rg32f) readonly uniform  imageBuffer image_peel;

	uint sharedPoolGetLink	(const uint index) {return imageLoad (image_pointers, int(index)).r;}
	vec4 sharedPoolGetValue (const uint index) {return imageLoad (image_peel	, int(index));}
	
	layout(location = 0, index = 0) out vec4 out_frag_color;

	void main(void)
	{	
		uint currID = uint(gl_FragCoord.x + width_2*gl_FragCoord.y) * 2U + 2U;	// head pointer
		currID		= sharedPoolGetLink(currID);								// start from nodes[1]

		int counter = 0;
		for(int i=0; i<HEAP_SIZE; i++)
		{
			vec2 Zi = sharedPoolGetValue(currID).rg;
			if (Zi.g == 1.0f)
				break;

			fragments[counter++] = Zi;
			currID = sharedPoolGetLink(currID);
		}

		if(counter > 0)
			out_frag_color = resolve(counter, true);
		else
			discard;
	}