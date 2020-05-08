#include "define.h"

	layout(binding = 0, r32ui) writeonly uniform uimage2DArray image_peel_depth;
	
	void  resetPixelFragDepthValue(const int coord_z, const uvec4 val){ imageStore (image_peel_depth, ivec3(gl_FragCoord.xy, coord_z), val);}

	void main(void)
	{
		for(int i=0; i<HEAP_SIZE; i++)
			resetPixelFragDepthValue(i, uvec4(0xFFFFFFFFU,0U,0U,0U));
	}