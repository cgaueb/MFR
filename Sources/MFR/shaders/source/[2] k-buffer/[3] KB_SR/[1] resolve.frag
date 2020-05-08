#include "define.h"
#include "sort.h"
#include "resolve.h"

	layout(binding = 0) uniform sampler2DMS tex_peel;

	layout(location = 0, index = 0) out  vec4 out_frag_color;

	void main(void)
	{
		int counter=0;
		for(int i=0; i<STENCIL_SIZE; i++)
		{
			vec2 peel = texelFetch(tex_peel, ivec2(gl_FragCoord.xy), i).rg;
			if(peel.g == 1.0f)
				break;
			fragments[counter++] = peel;
		}

		out_frag_color = resolve(counter, false);
	}
