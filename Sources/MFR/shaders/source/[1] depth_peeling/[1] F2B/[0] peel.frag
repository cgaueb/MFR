#include "define.h"

	vec4 computePixelColor();

	layout(binding  = 0) uniform sampler2DRect tex_depth;

	layout(depth_greater) 			out float gl_FragDepth;
	layout(location = 0, index = 0) out vec4  out_frag_color;

	void main(void)
	{
		if(gl_FragCoord.z <= texture (tex_depth, gl_FragCoord.xy).r)
			discard;
		out_frag_color = computePixelColor();
	}