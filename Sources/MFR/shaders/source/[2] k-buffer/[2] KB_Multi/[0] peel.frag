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

void main(void)
{
#if multipass
	if(gl_FragCoord.z <= texture(tex_depth, gl_FragCoord.xy).r)
		discard;
#endif

	vec4 k[8];
	k[0] = texture(tex_peel_0, gl_FragCoord.xy);
	k[1] = texture(tex_peel_1, gl_FragCoord.xy);
	k[2] = texture(tex_peel_2, gl_FragCoord.xy);
	k[3] = texture(tex_peel_3, gl_FragCoord.xy);
	k[4] = texture(tex_peel_4, gl_FragCoord.xy);
	k[5] = texture(tex_peel_5, gl_FragCoord.xy);
	k[6] = texture(tex_peel_6, gl_FragCoord.xy);
	k[7] = texture(tex_peel_7, gl_FragCoord.xy); 
   
	for(int i=0; i<KB_SIZE; i++)
#if packing
		if(gl_FragCoord.z == k[i].g || gl_FragCoord.z == k[i].a)
#else 
		if(gl_FragCoord.z == k[i].g)
#endif
			discard;

#if packing
	int p;
	ivec2 max_index = ivec2(-1);
#else
	int   max_index = -1;	
#endif 
	float max_depth = -1.0f;

	for(int i=0; i<KB_SIZE; i++)
#if packing
		for(int j=0; j<2; j++)
		{
			p = 2*j+1;
			if(k[i][p] > max_depth)
			{
				max_index = ivec2(i,2*j);
				max_depth = k[i][p];
			}
		}
#else 
		if(k[i].g > max_depth)
		{
			max_index = i;
			max_depth = k[i].g;
		}
#endif
	
	if(gl_FragCoord.z >= max_depth)
		discard;
	else
	{
		float C = uintBitsToFloat(packUnorm4x8(computePixelColor()));
#if packing
		vec2 value = vec2(C, gl_FragCoord.z); 
		k[max_index.x][max_index.y  ] = value.x;
		k[max_index.x][max_index.y+1] = value.y;
#else 
		vec4 value = vec4(C, gl_FragCoord.z, 0.0f, 0.0f);
		k[max_index] = value;
#endif
	}

	for(int i=0; i<KB_SIZE; i++)
		out_frag_color[i] = k[i];
}