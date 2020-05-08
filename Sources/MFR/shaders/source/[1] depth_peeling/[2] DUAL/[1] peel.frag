#include "define.h"

	vec4 computePixelColor();

	layout(binding = 0) uniform sampler2DRect tex_depth;

	layout(location = 0, index = 0) out vec4 out_frag_depth;
	layout(location = 1, index = 0) out vec4 out_frag_color_front;
	layout(location = 2, index = 0) out vec4 out_frag_color_back;

	void main()
	{
		vec2  depth 	 = texture(tex_depth, gl_FragCoord.xy).rg;
		float depth_near = -depth.x;
		float depth_far	 =  depth.y;

		out_frag_color_front = vec4(0.0);
		out_frag_color_back  = vec4(0.0);
		out_frag_depth.xy	 = vec2(-1.0f, -1.0f);

		if (gl_FragCoord.z < depth_near || gl_FragCoord.z > depth_far)
			discard;
		if (gl_FragCoord.z > depth_near && gl_FragCoord.z < depth_far)
		{ 
			out_frag_depth.xy = vec2(-gl_FragCoord.z, gl_FragCoord.z);
			return;
		}
		if (gl_FragCoord.z == depth_near) out_frag_color_front = computePixelColor();
		else							  out_frag_color_back  = computePixelColor();
	}