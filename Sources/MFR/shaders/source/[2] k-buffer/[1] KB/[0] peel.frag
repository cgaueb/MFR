#include "define.h"

	vec4 computePixelColor();

#if multipass
	layout(binding = 10) uniform sampler2DRect tex_depth;
#endif
	layout(binding = 0) uniform sampler2DRect tex_peel_0;
	layout(binding = 1) uniform sampler2DRect tex_peel_1;
	layout(binding = 2) uniform sampler2DRect tex_peel_2;
	layout(binding = 3) uniform sampler2DRect tex_peel_3;
	layout(binding = 4) uniform sampler2DRect tex_peel_4;
	layout(binding = 5) uniform sampler2DRect tex_peel_5;
	layout(binding = 6) uniform sampler2DRect tex_peel_6;
	layout(binding = 7) uniform sampler2DRect tex_peel_7;

	layout(location = 0, index = 0) out vec4 out_frag_color[8];

	vec4 k[8];

#if packing
	void insertionSort(ivec2 jk, vec2 value)
	{
		int r   = KB_SIZE-1;
		int num = r-jk.x;
		for(int i=0; i<num; i++)
		{
			k[r].zw = k[r].xy;
			k[r].xy = k[r-1].zw;
			r = r-1;
		}
	
		if(jk.y==0)
		{
			k[jk.x].zw = k[jk.x].xy;
			k[jk.x].xy = value;
		}
		else
			k[jk.x].zw = value;
	}
#endif

	void main(void)
	{
#if multipass
		if(gl_FragCoord.z <= texture (tex_depth, gl_FragCoord.xy).r)
			discard;
#endif

		k[0] = texture(tex_peel_0, gl_FragCoord.xy);
		k[1] = texture(tex_peel_1, gl_FragCoord.xy);
		k[2] = texture(tex_peel_2, gl_FragCoord.xy);
		k[3] = texture(tex_peel_3, gl_FragCoord.xy);
		k[4] = texture(tex_peel_4, gl_FragCoord.xy);
		k[5] = texture(tex_peel_5, gl_FragCoord.xy);
		k[6] = texture(tex_peel_6, gl_FragCoord.xy);
		k[7] = texture(tex_peel_7, gl_FragCoord.xy); 
    
		vec2 value = vec2(uintBitsToFloat(packUnorm4x8(computePixelColor())), gl_FragCoord.z);
#if packing
		for(int i=0; i<KB_SIZE; i++)
			for(int j=0; j<2; j++)
			{
				int p = j*2 +1;
				if(gl_FragCoord.z < k[i][p])
				{
					vec2 temp = value;
					value	  = vec2(k[i][p-1],k[i][p]);
					k[i][p-1] = temp.r;
					k[i][p  ] = temp.g;
				}
			}
#else
		for(int i=0; i<KB_SIZE; i++)
			if(value.g <= k[i].g)
			{
				vec2 temp = value;
				value = k[i].rg;
				k[i].rg = temp;
			}
#endif
		for(int i=0; i<KB_SIZE; i++)
			out_frag_color[i] = k[i];
	}