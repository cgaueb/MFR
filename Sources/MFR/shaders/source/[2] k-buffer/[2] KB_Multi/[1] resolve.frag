#include "define.h"
#include "sort.h"
#include "resolve.h"

	layout(binding = 0) uniform sampler2DRect tex_peel_0;
	layout(binding = 1) uniform sampler2DRect tex_peel_1;
	layout(binding = 2) uniform sampler2DRect tex_peel_2;
	layout(binding = 3) uniform sampler2DRect tex_peel_3;
	layout(binding = 4) uniform sampler2DRect tex_peel_4;
	layout(binding = 5) uniform sampler2DRect tex_peel_5;
	layout(binding = 6) uniform sampler2DRect tex_peel_6;
	layout(binding = 7) uniform sampler2DRect tex_peel_7;

	layout(location = 0, index = 0) out  vec4 out_frag_color;

	void main(void)
	{
#if packing
		vec2 k[16];
		vec4 kp;
		kp = texture(tex_peel_0, gl_FragCoord.xy);
		k[0]  = kp.xy;
		k[1]  = kp.zw;
		kp = texture(tex_peel_1, gl_FragCoord.xy);
		k[2]  = kp.xy;
		k[3]  = kp.zw;
		kp = texture(tex_peel_2, gl_FragCoord.xy);
		k[4]  = kp.xy;
		k[5]  = kp.zw;
		kp = texture(tex_peel_3, gl_FragCoord.xy);
		k[6]  = kp.xy;
		k[7]  = kp.zw;
		kp = texture(tex_peel_4, gl_FragCoord.xy);
		k[8]  = kp.xy;
		k[9]  = kp.zw;
		kp = texture(tex_peel_5, gl_FragCoord.xy);
		k[10] = kp.xy;
		k[11] = kp.zw;
		kp = texture(tex_peel_6, gl_FragCoord.xy);
		k[12] = kp.xy;
		k[13] = kp.zw;
		kp = texture(tex_peel_7, gl_FragCoord.xy);
		k[14] = kp.xy;
		k[15] = kp.zw;
#else
		vec2 k[8];
		k[0] = texture(tex_peel_0, gl_FragCoord.xy).rg;
		k[1] = texture(tex_peel_1, gl_FragCoord.xy).rg;
		k[2] = texture(tex_peel_2, gl_FragCoord.xy).rg;
		k[3] = texture(tex_peel_3, gl_FragCoord.xy).rg;
		k[4] = texture(tex_peel_4, gl_FragCoord.xy).rg;
		k[5] = texture(tex_peel_5, gl_FragCoord.xy).rg;
		k[6] = texture(tex_peel_6, gl_FragCoord.xy).rg;
		k[7] = texture(tex_peel_7, gl_FragCoord.xy).rg; 
#endif
		int size, counter=0;
#if packing
		size = 2*KB_SIZE;
#else
		size =   KB_SIZE;
#endif
		for(int i=0; i<size; i++)
		{
			if(k[i].g == 1.0f)
				break;
		
			fragments[counter++] = k[i];		
		}

		out_frag_color = resolve(counter, false);
}

