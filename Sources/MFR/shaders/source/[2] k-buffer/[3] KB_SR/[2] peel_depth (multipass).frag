#include "define.h"

	layout(binding = 0) uniform sampler2DMS tex_peel;

	layout(location = 0, index = 0) out vec4 out_frag_depth;

	void main(void)
	{
		float Z, maxZ = 0.0f;
		for (int i=0; i<STENCIL_SIZE; i++)
		{
			Z = texelFetch(tex_peel, ivec2(gl_FragCoord.xy), i).g;
			if(Z == 1.0f)
			{
				maxZ = 1.0f;
				break;
			}
			else if(Z > maxZ)
				maxZ = Z;
		}
		out_frag_depth.r = maxZ;
	}