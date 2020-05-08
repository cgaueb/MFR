#include "define.h"
#include "s-buffer.h"

	coherent uniform uint *next_address[COUNTERS];

	layout(binding = 0, r32ui) coherent uniform uimage2DArray image_count_countT_next_sem;

	uint addSharedNextAddress	   (int j,	uint val) { return	atomicAdd	(next_address[j], val);}
	void setPixelNextAddress	   (	 	uint val) {			imageStore	(image_count_countT_next_sem, ivec3(gl_FragCoord.xy,2), uvec4(val, 0U, 0U, 0U) );}
	uint getPixelFragCounterTotal  (				) { return	imageLoad   (image_count_countT_next_sem, ivec3(gl_FragCoord.xy,1)).x ;}

	void main(void)
	{
		uint counter = getPixelFragCounterTotal();
		if(counter == 0U)
			discard;

		int  hash_id = hashFunction(ivec2(gl_FragCoord.y));
		uint address = addSharedNextAddress (hash_id, counter);
		setPixelNextAddress (address);
	}