#include "define.h"

	layout(binding = 0) uniform sampler2DRect tex_peel_7;

	layout(location = 0, index = 0) out vec4 out_frag_depth;

	void main(void)
	{
#if packing
		out_frag_depth.r = texture	 (tex_peel_7, gl_FragCoord.xy).a; 
#else
		out_frag_depth.r = texture	 (tex_peel_7, gl_FragCoord.xy).g; 
#endif
	}