#include "define.h"

	uniform int width_2;

	layout(binding = 1, r32ui) writeonly uniform uimageBuffer image_pointers;
	layout(binding = 4, rg32f) writeonly uniform  imageBuffer image_peel;

	void sharedPoolSetValue (const uint index,	const vec4 val) { imageStore (image_peel	 , int(index), val);}
	void sharedPoolSetLink	(const uint index,	const uint val) { imageStore (image_pointers, int(index), uvec4(val, 0U, 0U, 0U));}
	
	void main(void)
	{
		uint  P_ID, ID = uint(gl_FragCoord.x + width_2*gl_FragCoord.y) * 2U + 1U;

		// Tail node
		{
			P_ID = ID;

			sharedPoolSetLink	(P_ID,   0U);
			sharedPoolSetValue	(P_ID, vec4(0.0f,1.0f,0.0f,0.0f));
		}

		// Head node
		{
			P_ID = ID + 1U;

			sharedPoolSetLink	(P_ID,   ID);
			sharedPoolSetValue	(P_ID, vec4(0.0f));
		}
	}
