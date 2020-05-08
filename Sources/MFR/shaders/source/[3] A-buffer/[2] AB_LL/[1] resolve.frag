#include "define.h"
#include "data_structs.h"
#include "sort_fixed.h"

	uniform int	layer;

	layout(binding = 0, r32ui)	readonly uniform uimage2DRect image_next;
	layout(binding = 1, r32ui)	readonly uniform uimage2DRect image_counter;
	layout(binding = 2 std430)  readonly buffer LinkedLists { NodeTypeLL nodes[]; };

	uint getPixelCurrentPageID	()					 {return imageLoad (image_next			, ivec2(gl_FragCoord.xy)).x;}
	uint getPixelFragCounter	()					 {return imageLoad (image_counter		, ivec2(gl_FragCoord.xy)).x;}
	
	layout(location = 0, index = 0) out vec4 out_frag_color;
	
	void main(void)
	{
		int counterTotal = int(getPixelFragCounter());
		if(counterTotal > 0)
		{
			float prevZ = 0.0f;
			uint  init_page_id = getPixelCurrentPageID();

			int  Iter = int(ceil(float(counterTotal)/float(LOCAL_SIZE)));
			for(int I=0; I<Iter; I++)
			{
				int  counterLocal = 0;
				uint page_id = init_page_id;
				fragments [LOCAL_SIZE_1n].g = 1.0f;

				for(int C=0; C<counterTotal; C++)
				{
					NodeTypeLL new_node = nodes[page_id];
					
					page_id	= new_node.next;
					if(I>0 && new_node.depth <= prevZ)
						continue;

					if(counterLocal < LOCAL_SIZE_1n)
						fragments [counterLocal++] = vec2(uintBitsToFloat(new_node.color), new_node.depth);
					else if(new_node.depth < fragments [LOCAL_SIZE_1n].g)
						fragments [setMaxFromGlobalArray(new_node.depth)] = vec2(uintBitsToFloat(new_node.color), new_node.depth);
				}

				prevZ = fragments [LOCAL_SIZE_1n].g;

				sort(min(counterLocal,LOCAL_SIZE));

				if(layer < (I+1)*LOCAL_SIZE)
				{
					out_frag_color = unpackUnorm4x8(floatBitsToUint(fragments [layer-I*LOCAL_SIZE].r));
					break;
				}
			}
		}

		if(layer < counterTotal)
			return;
		else
			discard;
	}