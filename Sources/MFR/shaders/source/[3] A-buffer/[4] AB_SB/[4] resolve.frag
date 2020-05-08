#include "define.h"
#include "s-buffer.h"
#include "sort_fixed.h"

	uniform int	  layer;
	uniform uint *final_address[COUNTERS];

	layout(binding = 0, r32ui) readonly  uniform uimage2DRect  image_counter;
	layout(binding = 1, r32ui) readonly  uniform uimage2DRect  image_next;
	layout(binding = 2, rg32f) readonly  uniform imageBuffer   image_peel;

	vec4 sharedPoolGetValue	  (const uint index	) {return imageLoad (image_peel, int(index));}
	uint getPixelNextAddress  (					) {return imageLoad (image_next   , ivec2(gl_FragCoord.xy)).x-1U;}
	uint getPixelFragCounter  (					) {return imageLoad (image_counter, ivec2(gl_FragCoord.xy)).x;   }

	layout(location = 0, index = 0) out vec4 out_frag_color;

	void main(void)
	{
		int counterTotal = int(getPixelFragCounter());
		if(counterTotal > 0)
		{	
			uint address = getPixelNextAddress();
			int  hash_id = hashFunction(ivec2(gl_FragCoord.xy));

#if inverse	
			bool front_prefix = hash_id < COUNTERS_2d ? true : false;
#else
			bool front_prefix = true;
#endif
			uint sum = (*final_address[hash_id]);

			uint init_page_id = front_prefix ? address + sum : imageSize(image_peel) + 1U - address - sum;
			uint direction   = front_prefix ? -1U : 1U;
			
			float prevZ = 0.0f;

			int  Iter = int(ceil(float(counterTotal)/float(LOCAL_SIZE)));
			for(int I=0; I<Iter; I++)
			{
				int  counterLocal = 0;
				uint page_id	  = init_page_id;
				fragments[LOCAL_SIZE_1n].g = 1.0f;

				for(int C=0; C<counterTotal; C++)
				{
					vec2 peel_pointer = sharedPoolGetValue(page_id).rg;
					page_id			 += direction;
					if(I>0 && peel_pointer.g <= prevZ)
						continue;

					if(counterLocal < LOCAL_SIZE_1n)
						fragments [counterLocal++] = peel_pointer.rg;
					else if(peel_pointer.g < fragments [LOCAL_SIZE_1n].g)
						fragments [setMaxFromGlobalArray(peel_pointer.g)] = peel_pointer.rg;
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