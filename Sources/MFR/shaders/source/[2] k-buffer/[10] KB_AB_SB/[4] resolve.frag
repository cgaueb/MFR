#include "define.h"
#include "s-buffer.h"
#include "sort.h"
#include "resolve.h"

	uniform uint *final_address[COUNTERS];

	layout(binding = 0, r32ui) readonly  uniform uimage2DRect  image_counter;
	layout(binding = 1, r32ui) readonly  uniform uimage2DRect  image_next;
	layout(binding = 2, rg32f) readonly  uniform  imageBuffer  image_peel;

	uint getPixelNextAddress  (					) {return imageLoad (image_next   , ivec2(gl_FragCoord.xy)).x-1U;}
	uint getPixelFragCounter  (					) {return imageLoad (image_counter, ivec2(gl_FragCoord.xy)).x;   }
	vec4 sharedPoolGetValue   (const uint index	) {return imageLoad (image_peel	  , int(index));}

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
		int counterTotal = int(getPixelFragCounter());
		if(counterTotal > 0)
		{	
			uint address = getPixelNextAddress();
			int  hash_id = hashFunction(ivec2(gl_FragCoord.y));
#if inverse	
			bool front_prefix = hash_id < COUNTERS_2d ? true : false;
#else
			bool front_prefix = true;
#endif
			uint sum = (*final_address[hash_id]);

			uint page_id   = front_prefix ? address + sum : imageSize(image_peel) - address - sum;
			uint direction = front_prefix ? -1U : 1U;
			
			if (counterTotal > HEAP_SIZE)
			{
				int  counterLocal = 0;
				fragments[HEAP_SIZE_1n].g = 1.0f;

				for(int C=0; C<counterTotal; C++)
				{
					vec2 peel_pointer = sharedPoolGetValue(page_id).rg;
					page_id	  += direction;
					
					if(counterLocal < HEAP_SIZE_1n)
						fragments [counterLocal++] = peel_pointer.rg;
					else if(peel_pointer.g < fragments [HEAP_SIZE_1n].g)
						fragments [setMaxFromGlobalArray(peel_pointer.g)] = peel_pointer.rg;
				}
				counterTotal = HEAP_SIZE;
			}
			else
			{
				for(int i=0; i<counterTotal; i++)
				{
					fragments[i] = sharedPoolGetValue(page_id).rg;
					page_id		+= direction;
				}
			}
			out_frag_color = resolve(counterTotal, false);
		}
		else
			discard;
	}