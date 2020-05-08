#include "define.h"

	layout(binding = 0, r32ui)		readonly uniform uimage2DArray image_count_countT_next_sem;
	layout(binding = 3, offset = 0)			 uniform atomic_uint	histogram[HISTOGRAM_SIZE];

	uint getPixelFragCounter() {return imageLoad(image_count_countT_next_sem, ivec3(gl_FragCoord.xy, 1)).r;}

	void main(void)
	{
		int counter = int(getPixelFragCounter());
		if (counter == 0)
			discard;
			
		atomicCounterIncrement(histogram[counter-1]);
	}