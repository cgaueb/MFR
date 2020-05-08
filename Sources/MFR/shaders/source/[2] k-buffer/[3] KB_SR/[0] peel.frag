#include "define.h"

	vec4 computePixelColor();

#if multipass
	layout(binding = 0) uniform sampler2DRect tex_depth;
#endif

	layout(location = 0, index = 0) out vec4 out_frag_color;

	void main(void)
	{
	#if multipass
		if(gl_FragCoord.z <= texture(tex_depth, gl_FragCoord.xy).r)
			discard;
	#endif
		out_frag_color = vec4(uintBitsToFloat(packUnorm4x8(computePixelColor())), gl_FragCoord.z, 0.0f, 0.0f);
	}