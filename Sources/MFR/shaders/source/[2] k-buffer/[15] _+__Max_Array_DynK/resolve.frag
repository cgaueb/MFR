#include "define.h"
#include "sort_fixed.h"

	uniform int	layer;
	uniform int K_SIZE;

	layout(binding = 0, r32ui) readonly uniform uimage2DRect  image_counter;
	layout(binding = 2, rg32f) readonly uniform  image2DArray image_peel;
	
	uint getPixelFragCounter	(				  ) { return imageLoad (image_counter, ivec2(gl_FragCoord.xy)).r;}
	vec4 getPixelFragValue		(const int coord_z) { return imageLoad (image_peel	 , ivec3(gl_FragCoord.xy, coord_z));}

	layout(location = 0, index = 0) out  vec4 out_frag_color;

	void main(void)
	{
		int counterTotal = int(getPixelFragCounter());
		if(counterTotal > 0)
		{
			float prevZ = 0.0f;

			int  Iter = int(ceil(float(counterTotal)/float(LOCAL_SIZE)));
			for(int I=0; I<Iter; I++)
			{
				int  counterLocal = 0;
				fragments[LOCAL_SIZE_1n].g = 1.0f;

				for(int C=K_SIZE-1; C>=K_SIZE-counterTotal; C--)
				{
					vec2 peel = getPixelFragValue(C).rg;
					
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