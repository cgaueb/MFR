#include "define.h"
#include "sort.h"
#include "resolve.h"

	layout(binding = 0, rg32f) readonly uniform  image2DArray image_peel;
	
	vec4 getPixelFragDepthValue (const int coord_z) {return imageLoad (image_peel, ivec3(gl_FragCoord.xy, coord_z));}

	layout(location = 0, index = 0) out  vec4 out_frag_color;

	void main(void)
	{
		int counter=0;
		for(int i=0; i<HEAP_SIZE; i++)
		{
			vec2 Zi = getPixelFragDepthValue(i).rg;
			if(Zi.g == 1.0f)
				break;
			fragments[counter++] = Zi;
		}
		out_frag_color = resolve(counter, true);
	}