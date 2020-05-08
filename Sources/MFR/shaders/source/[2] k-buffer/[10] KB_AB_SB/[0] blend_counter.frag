#include "define.h"
#include "s-buffer.h"

	layout(binding = 0, r32ui) coherent uniform uimage2DRect image_counter;
	
	void incPixelFragCounter() {imageAtomicAdd(image_counter, ivec2(gl_FragCoord.xy), 1U);}

	void main(void)
	{
		incPixelFragCounter();
	}

