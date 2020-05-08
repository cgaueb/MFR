#include "define.h"

	layout(binding = 2, r32f ) readonly uniform  image2DArray image_peel_depth;

	vec4  getPixelFragDepthValue(const int coord_z)	{ return imageLoad  (image_peel_depth, ivec3(gl_FragCoord.xy, coord_z));}

	layout(location = 0, index = 0) out vec4 out_frag_depth;

	void main(void)
	{
		out_frag_depth.r = getPixelFragDepthValue(0);
	}