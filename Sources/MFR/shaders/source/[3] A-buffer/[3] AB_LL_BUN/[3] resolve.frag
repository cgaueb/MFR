#include "define.h"
#include "data_structs.h"
#include "sort_fixed.h"

	uniform int	layer;

	layout(binding = 0, r32ui)  readonly uniform uimage2DArray	image_next;
	layout(binding = 4, std430) readonly buffer  LinkedLists { NodeTypeLL nodes[]; };

	uint getPixelCurrentPageID	(const int  b) {return imageLoad (image_next, ivec3(gl_FragCoord.xy, b)).r;}

	layout(location = 0, index = 0) out vec4 out_frag_color;

	void main(void)
	{
		bool found = false;
		NodeTypeLL new_node;

		int  counterTotal=0, counterTotalPrev=0;
		for (int b=0; b<BUN_SIZE; b++)
		{
			int		counterTotalb= 0;
			float	prevZ		 = 0.0f;
			uint	init_page_id = getPixelCurrentPageID(b);
			if(		init_page_id > 0U)
			{
				int		I=0,	Iter=1;
				while(	I	<	Iter)
				{
					int  counterLocal = 0;
					uint page_id = init_page_id;
					fragments [LOCAL_SIZE_1n].g = 1.0f;

					while(page_id != 0U)
					{				
						new_node = nodes[page_id];
						page_id	 = new_node.next;
						
						if(I==0)
							counterTotalb++;
						else if(new_node.depth <= prevZ)
							continue;

						if(counterLocal < LOCAL_SIZE_1n)
							fragments [counterLocal++]						  = vec2(uintBitsToFloat(new_node.color), new_node.depth);
						else if(new_node.depth < fragments [LOCAL_SIZE_1n].g)
							fragments [setMaxFromGlobalArray(new_node.depth)] = vec2(uintBitsToFloat(new_node.color), new_node.depth);
					}					
					
					prevZ = fragments [LOCAL_SIZE_1n].g;

					sort(counterLocal);

					if(I==0)
						Iter = int(ceil(float(counterTotalb)/float(LOCAL_SIZE)));
					
					int l = layer-counterTotalPrev;
					if(l < counterTotalb && l < (I+1)*LOCAL_SIZE)
					{
						out_frag_color = unpackUnorm4x8(floatBitsToUint(fragments [l-I*LOCAL_SIZE].r));
						found = true;
						break;
					}
					I++;
				}
				
				if(found)
					break;
			}
	
			counterTotal	 += counterTotalb;
			counterTotalPrev  = counterTotal;
		}

		if(found)
			return;
		else
			discard;
	}