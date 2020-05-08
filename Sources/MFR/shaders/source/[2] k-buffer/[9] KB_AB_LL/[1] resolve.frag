#include "define.h"
#include "data_structs.h"
#include "sort.h"
#include "resolve.h"

	layout(binding = 0, r32ui)	readonly uniform uimage2DRect image_next;
	layout(binding = 1, std430) readonly buffer LinkedLists { NodeTypeLL nodes[]; };

	uint getPixelCurrentPageID	(){return imageLoad (image_next, ivec2(gl_FragCoord.xy)).r;}
	
	layout(location = 0, index = 0) out vec4 out_frag_color;

	int setMaxFromGlobalArray(float Z)
	{
		int  id;
		vec2 maxFR = vec2(-1.0f,0.0f);
		
		for(int i=0; i<HEAP_SIZE_1n; i++)
		{
			float Zi = fragments[i].g;
			if(maxFR.g < Zi)
			{
				maxFR.r = i;
				maxFR.g = Zi;
			}
		}

		if(Z < maxFR.g)
		{
			id = int(maxFR.r);
			fragments[HEAP_SIZE_1n] = vec2(fragments[id].r, maxFR.g);
		}
		else
			id = HEAP_SIZE_1n;

		return id;
	}

	void main(void)
	{
		uint page_id = getPixelCurrentPageID();
		if(page_id > 0U)
		{
			int	counter = 0;
			while(page_id != 0U)
			{
				fragments [HEAP_SIZE_1n].g = 1.0f;

				NodeTypeLL new_node = nodes[page_id];
				page_id	= new_node.next;

				if(counter < HEAP_SIZE_1n)
					fragments [counter++] = vec2(uintBitsToFloat(new_node.color), new_node.depth);
				else if(new_node.depth < fragments [HEAP_SIZE_1n].g)
					fragments [setMaxFromGlobalArray(new_node.depth)] = vec2(uintBitsToFloat(new_node.color), new_node.depth);
			}
			out_frag_color = resolve(min(counter,HEAP_SIZE), false);
		}
		else
			discard;
	}