#include "define.h"
#include "s-buffer.h"

	coherent uniform uint *next_address[COUNTERS];

	layout(binding = 0, r32ui) readonly  uniform uimage2DRect  image_counter;
	layout(binding = 1, r32ui) writeonly uniform uimage2DRect  image_next;

	uint addSharedNextAddress (int j,	uint val) { return	atomicAdd	(next_address[j], val);}
	void setPixelNextAddress  (			uint val) {			imageStore	(image_next	  , ivec2(gl_FragCoord.xy), uvec4(val, 0U, 0U, 0U) );}
	uint getPixelFragCounter  (					) { return	imageLoad   (image_counter, ivec2(gl_FragCoord.xy)).x ;}
	
	void main(void)
	{
		uint counter = getPixelFragCounter();
		if(counter == 0U)
			discard;

		int  hash_id = hashFunction(ivec2(gl_FragCoord.y));
		uint address = addSharedNextAddress (hash_id, counter);
		setPixelNextAddress (address);
	}