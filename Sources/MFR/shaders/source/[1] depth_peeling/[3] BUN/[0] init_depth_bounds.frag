#include "version.h"

	layout(location = 0, index = 0) out vec4 out_frag_depth;

	void main(void)
	{
		out_frag_depth.xy = vec2(-gl_FragCoord.z, gl_FragCoord.z);
	}