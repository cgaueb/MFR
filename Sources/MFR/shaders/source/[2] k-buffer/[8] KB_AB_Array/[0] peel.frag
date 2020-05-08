#include "define.h"

	vec4 computePixelColor();

	layout(binding = 0, r32ui) coherent  uniform uimage2DRect	image_counter;
	layout(binding = 2, rg32f) writeonly uniform  image2DArray	image_peel;

	uint  addPixelFragCounter(									 ) {return	imageAtomicAdd	(image_counter	, ivec2(gl_FragCoord.xy), 1U);}
	void  setPixelFragValue	 (const int   coord_z, const vec4 val) {			imageStore	(image_peel		, ivec3(gl_FragCoord.xy, coord_z), val);}

	void main(void)
	{
		float	C		= uintBitsToFloat(packUnorm4x8(computePixelColor()));
		int		index	= int(addPixelFragCounter());

		setPixelFragValue(index, vec4(C, gl_FragCoord.z, 0.0f, 0.0f));
	}