#include "define.h"

	vec4 computePixelColor();

	layout(binding = 0, r32ui) coherent  uniform uimage2DRect	 image_counter;
	layout(binding = 1, rg32f) writeonly uniform  image2DArray	 image_peel;

	uint  addPixelFragCounter	(								) { return	imageAtomicAdd	(image_counter, ivec2(gl_FragCoord.xy), 1U);}
	void  setPixelFragValue		(const int index, const vec4 val) {			imageStore		(image_peel   , ivec3(gl_FragCoord.xy, index), val);}

	void main(void)
	{
		vec4 value	= vec4(uintBitsToFloat(packUnorm4x8(computePixelColor())), gl_FragCoord.z, 0.0f, 0.0f);
		int  id		= int(addPixelFragCounter ());

		setPixelFragValue(id, value);
	}