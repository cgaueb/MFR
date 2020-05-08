#include "define.h"
#include "s-buffer.h"
#include "sort_fixed.h"

	uniform int   K_SIZE;
	uniform int	  layer;
	uniform uint *final_address[COUNTERS];
	
	layout(binding = 0, r32ui) readonly  uniform uimage2DArray image_count_countT_next_sem;
	layout(binding = 2, rg32f) readonly  uniform  imageBuffer  image_peel;

	uint getPixelFragCounter(				 ) {return imageLoad(image_count_countT_next_sem, ivec3(gl_FragCoord.xy, 0)).r;}
	uint getPixelNextAddress(				 ) {return imageLoad(image_count_countT_next_sem, ivec3(gl_FragCoord.xy, 2)).r;}
	vec4 sharedPoolGetValue (const uint index) {return imageLoad(image_peel, int(index));}

	layout(location = 0, index = 0) out vec4 out_frag_color;

	void main(void)
	{
		int counterTotal = int(getPixelFragCounter());
		if(counterTotal > 0)
		{	
			uint  address = getPixelNextAddress();
			int   hash_id = hashFunction(ivec2(gl_FragCoord.y));
			float prevZ = 0.0f;

			int  Iter = int(ceil(float(counterTotal)/float(LOCAL_SIZE)));
			for(int I=0; I<Iter; I++)
			{
				uint page_id = (*final_address[hash_id]) + address;

				int  counterLocal = 0;
				fragments[LOCAL_SIZE_1n].g = 1.0f;

				for(int C=0; C<K_SIZE; C++)
				{
					vec2 peel = sharedPoolGetValue(page_id++).rg;
					
					if(I>0 && peel.g <= prevZ)
						continue;

					if(counterLocal < LOCAL_SIZE_1n)
						fragments [counterLocal++] = peel.rg;
					else if(peel.g < fragments [LOCAL_SIZE_1n].g)
						fragments [setMaxFromGlobalArray(peel.g)] = peel.rg;
				}
				prevZ = fragments [LOCAL_SIZE_1n].g;

				sort(min(counterLocal, LOCAL_SIZE));

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