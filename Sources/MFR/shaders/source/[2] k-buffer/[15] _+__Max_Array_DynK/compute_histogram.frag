#include "define.h"

	layout(binding = 0, r32ui)		readonly uniform uimage2DRect	image_counter;
	layout(binding = 3, offset = 0)			 uniform atomic_uint	histogram[HISTOGRAM_SIZE];

	uint getPixelFragCounter() {return imageLoad(image_counter, ivec2(gl_FragCoord.xy)).r;}

	void main(void)
	{
		int counter = int(getPixelFragCounter());
		if (counter == 0)
			discard;
			
		atomicCounterIncrement(histogram[counter-1]);
	}