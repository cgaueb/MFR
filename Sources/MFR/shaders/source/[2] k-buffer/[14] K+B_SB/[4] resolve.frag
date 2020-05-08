#include "define.h"
#include "s-buffer.h"
#include "sort.h"
#include "resolve.h"

	uniform uint *final_address[COUNTERS];
	
	layout(binding = 0, r32ui) readonly  uniform uimage2DArray image_count_countT_next_sem;
	layout(binding = 2, rg32f) readonly  uniform  imageBuffer  image_peel;

	uint getPixelFragCounter(					) {return imageLoad (image_count_countT_next_sem, ivec3(gl_FragCoord.xy,0)).x;}
	uint getPixelNextAddress(					) {return imageLoad (image_count_countT_next_sem, ivec3(gl_FragCoord.xy,2)).x;}
	vec4 sharedPoolGetValue (const uint index	) {return imageLoad (image_peel, int(index));}

	layout(location = 0, index = 0) out vec4 out_frag_color;

	void main(void)
	{
		int counter = int(getPixelFragCounter());
		if(counter > 0)
		{	
			uint address = getPixelNextAddress();
			int  hash_id = hashFunction(ivec2(gl_FragCoord.y));
			uint page_id = (*final_address[hash_id]) + address;
	
			for(int i=0; i<counter; i++)
				fragments[i] = sharedPoolGetValue(page_id++).rg;
			out_frag_color = resolve(counter, false);
		}
		else
			discard;
	}