#include "define.h"

	layout(binding = 0, r32ui) readonly uniform uimage2DRect  image_counter;
	layout(binding = 2, rg32f) readonly uniform  image2DArray image_peel;

	uint  getPixelFragCounter	(				  )	{ return imageLoad  (image_counter, ivec2(gl_FragCoord.xy)).r;}
	float getPixelFragDepthValue(const int coord_z)	{ return imageLoad  (image_peel	  , ivec3(gl_FragCoord.xy, coord_z)).g;}

	layout(location = 0, index = 0) out vec4 out_frag_depth;

	void main(void)
	{
		out_frag_depth.r = getPixelFragDepthValue(0);
	}