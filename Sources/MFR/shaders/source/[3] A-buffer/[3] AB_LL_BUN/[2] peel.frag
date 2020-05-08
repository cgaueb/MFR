#include "define.h"
#include "data_structs.h"

	vec4 computePixelColor();

	layout(binding = 0, r32ui  ) coherent  uniform uimage2DArray	image_next;
	layout(binding = 1, r32ui  ) readonly  uniform uimage2DArray	image_min_max;
	layout(binding = 2, std430 ) coherent  buffer  LinkedLists    { NodeTypeLL nodes[]; };
	layout(binding = 3, offset = 0)		   uniform atomic_uint		next_address;

	float getPixelFragDepthMin		(								 )	{ return uintBitsToFloat	(imageLoad (image_min_max, ivec3(gl_FragCoord.xy, 0)).r);}
	float getPixelFragDepthMax		(								 )	{ return uintBitsToFloat	(imageLoad (image_min_max, ivec3(gl_FragCoord.xy, 1)).r);}
	uint  exchangePixelCurrentPageID(const int  b	 , const uint val)	{ return imageAtomicExchange(image_next				 , ivec3(gl_FragCoord.xy, b), val);}

	void main(void)
	{
		// Find Memory Index
		uint page_id = atomicCounterIncrement(next_address) + 1U;
		if(	 page_id < nodes.length())
		{
			// Find Bucket 
			float	depth_near   = getPixelFragDepthMin();
			float	depth_far    = getPixelFragDepthMax();
			float	depth_length = depth_far - depth_near;
			int		bucket		 = int((float(BUN_SIZE)*((gl_FragCoord.z-depth_near)/depth_length))); 
			if (bucket == BUN_SIZE) bucket = BUN_SIZE-1;

			uint next_id = exchangePixelCurrentPageID(bucket, page_id);
	
			nodes[page_id].color = packUnorm4x8(computePixelColor());
			nodes[page_id].depth = gl_FragCoord.z;
			nodes[page_id].next  = next_id;

			discard;
		}
	}