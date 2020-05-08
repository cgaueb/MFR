#include "define.h"
#include "s-buffer.h"

	uniform uint *final_address[COUNTERS];

	layout(binding = 0, r32ui) readonly  uniform uimage2DArray image_count_countT_next_sem;
	layout(binding = 2, r32f ) writeonly uniform  imageBuffer  image_peel_depth;

	uint  getPixelFragNextAddress	(				 ) { return imageLoad  (image_count_countT_next_sem	, ivec3(gl_FragCoord.xy, 2)).r;}
	void  sharedPoolResetDepthValue	(const uint index) {		imageStore (image_peel_depth			, int(index), vec4 (0.0f,1.0f,0.0f,0.0f));}

	void main(void)
	{
		uint  address = getPixelFragNextAddress();
		int   hash_id = hashFunction(ivec2(gl_FragCoord.y));
		uint  start   = (*final_address[hash_id]) + address;

		sharedPoolResetDepthValue(start);
	}