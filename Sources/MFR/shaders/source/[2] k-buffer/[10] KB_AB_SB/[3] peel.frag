#include "define.h"
#include "s-buffer.h"

	vec4 computePixelColor();

	uniform uint *final_address[COUNTERS];

	layout(binding = 1, r32ui) coherent  uniform uimage2DRect image_next;
	layout(binding = 2, rg32f) writeonly uniform  imageBuffer image_peel;
	
	uint incPixelNextAddress(								  )	{return imageAtomicAdd	(image_next, ivec2(gl_FragCoord.xy), 1U);}
	void sharedPoolSetValue (const uint index, const  vec4 val)	{		imageStore		(image_peel, int(index), val);}

	void main(void)
	{
		float C		  = uintBitsToFloat(packUnorm4x8(computePixelColor()));
		uint  page_id = incPixelNextAddress();
		int   hash_id = hashFunction(ivec2(gl_FragCoord.y));
		uint  sum     = (*final_address[hash_id]) + page_id;

	#if inverse
		uint  index = hash_id < COUNTERS_2d ? sum : imageSize(image_peel) - sum;
	#else
		uint  index = sum;
	#endif

		sharedPoolSetValue (index,  vec4(C, gl_FragCoord.z,0.0f,0.0f));
	}