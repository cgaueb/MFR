#include "define.h"

	layout(binding = 0, rg32f) writeonly uniform  image2DArray image_peel;

	void  resetPixelFragDepth (const int coord_z) {imageStore (image_peel, ivec3(gl_FragCoord.xy, coord_z), vec4(1.0f));}

	void main(void)
	{
		for(int i=0; i<HEAP_SIZE; i++)
			resetPixelFragDepth(i);
	}