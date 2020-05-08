#include "define.h"
#include "sort.h"
#include "resolve.h"

	layout(binding = 0, r32ui) readonly uniform uimage2DRect	image_counter;
	layout(binding = 2, rg32f) readonly uniform  image2DArray	image_peel;

	uint getPixelFragCounter(				  ) {return	imageLoad (image_counter, ivec2(gl_FragCoord.xy)).r;}
	vec4 getPixelFragValue	(const int coord_z) {return imageLoad (image_peel	, ivec3(gl_FragCoord.xy, coord_z));}

	layout(location = 0, index = 0) out  vec4 out_frag_color;

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
			if (counterTotal > HEAP_SIZE)
			{
				int  counterLocal = 0;
				fragments[HEAP_SIZE_1n].g = 1.0f;

				for(int C=0; C<counterTotal; C++)
				{
					vec2 peel_pointer = getPixelFragValue(C).rg;
					
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
					fragments[i] = getPixelFragValue(i).rg;
			}
			
			out_frag_color = resolve(counterTotal, false);
		}
		else
			discard;
	}