#include "define.h"
#include "sort.h"
#include "resolve.h"
	
	layout(binding = 0, r32ui) readonly uniform uimage2DRect  image_counter;
	layout(binding = 2, rg32f) readonly uniform  image2DArray image_peel;
	
	uint getPixelFragCounter(				  ) { return imageLoad (image_counter, ivec2(gl_FragCoord.xy)).r;}
	vec4 getPixelFragValue	(const int coord_z) { return imageLoad (image_peel	 , ivec3(gl_FragCoord.xy, coord_z));}

	layout(location = 0, index = 0) out vec4 out_frag_color;

	void main(void)
	{
		int counter = int(getPixelFragCounter());
		if(counter > 0)
		{
			for(int i=0; i<counter; i++)
				fragments[i] = getPixelFragValue(i).rg;
			out_frag_color = resolve(counter, false);
		}
		else
			discard;
	}