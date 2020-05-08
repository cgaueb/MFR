#include "define.h"

	layout(binding = 0) uniform sampler2DRect tex_peel_0;
	layout(binding = 1) uniform sampler2DRect tex_peel_1;
	layout(binding = 2) uniform sampler2DRect tex_peel_2;
	layout(binding = 3) uniform sampler2DRect tex_peel_3;
	layout(binding = 4) uniform sampler2DRect tex_peel_4;
	layout(binding = 5) uniform sampler2DRect tex_peel_5;
	layout(binding = 6) uniform sampler2DRect tex_peel_6;
	layout(binding = 7) uniform sampler2DRect tex_peel_7;

	layout(location = 0, index = 0) out vec4 out_frag_depth;

	void main(void)
	{
		vec4 k[8];
		k[0] = texture(tex_peel_0, gl_FragCoord.xy);
		k[1] = texture(tex_peel_1, gl_FragCoord.xy);
		k[2] = texture(tex_peel_2, gl_FragCoord.xy);
		k[3] = texture(tex_peel_3, gl_FragCoord.xy);
		k[4] = texture(tex_peel_4, gl_FragCoord.xy);
		k[5] = texture(tex_peel_5, gl_FragCoord.xy);
		k[6] = texture(tex_peel_6, gl_FragCoord.xy);
		k[7] = texture(tex_peel_7, gl_FragCoord.xy); 
	
		float maxZ = 0.0f;
		for (int i = 0; i < KB_SIZE; i++)
		{
			if(k[i].g == 1.0f)
			{
				maxZ = 1.0f;
				break;
			}
			else if(k[i].g > maxZ)
				maxZ = k[i].g;
#if packing
			if(k[i].a == 1.0f)
			{
				maxZ = 1.0f;
				break;
			}
			else if(k[i].a > maxZ)
				maxZ = k[i].a;
#endif
		}
		out_frag_depth.r = maxZ;
	}