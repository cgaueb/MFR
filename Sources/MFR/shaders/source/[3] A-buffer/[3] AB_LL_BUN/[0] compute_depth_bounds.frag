#include "version.h"

	layout(binding = 1, r32ui) coherent uniform uimage2DArray image_min_max;

	void  setPixelFragMinDepth (uint Z) { imageAtomicMin (image_min_max, ivec3(gl_FragCoord.xy, 0), Z); }
	void  setPixelFragMaxDepth (uint Z) { imageAtomicMax (image_min_max, ivec3(gl_FragCoord.xy, 1), Z); }

	void main(void)
	{
		uint Z = floatBitsToUint(gl_FragCoord.z);

		setPixelFragMinDepth (Z);
		setPixelFragMaxDepth (Z);
	}