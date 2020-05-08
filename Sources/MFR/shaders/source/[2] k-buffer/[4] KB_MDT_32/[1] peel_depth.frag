#include "define.h"

	layout(binding = 0, r32ui) coherent uniform uimage2DArray image_peel_depth;

	uint setMinPixelFragDepthValue	(const int coord_z, const uint val	) { return imageAtomicMin(image_peel_depth, ivec3(gl_FragCoord.xy, coord_z), val);}

	void main(void)
	{
		uint zOld, zTest = floatBitsToUint(gl_FragCoord.z);
		for(int i=0; i<HEAP_SIZE; i++)
		{
			zOld = setMinPixelFragDepthValue(i, zTest);
			if (zOld == 0xFFFFFFFFU || zOld == zTest)
				break;
			zTest = max (zOld, zTest);
		}
	}