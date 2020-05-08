#include "define.h"

	layout(binding = 0, r32ui) coherent uniform uimage2DRect image_counter;
	
	void incPixelFragCounterTotal() {imageAtomicAdd	(image_counter, ivec2(gl_FragCoord.xy), 1U);}

	void main(void)
	{
		incPixelFragCounterTotal();
	}