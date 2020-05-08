#include "define.h"

	layout(binding = 0, r32ui) coherent uniform uimage2DArray image_count_countT_next_sem;

	void incPixelFragCounterTotal() {imageAtomicAdd	(image_count_countT_next_sem, ivec3(gl_FragCoord.xy, 1), 1U);}

	void main(void)
	{
		incPixelFragCounterTotal();
	}