#include "define.h"

	layout(binding = 0) uniform sampler2DRect tex_depth_bounds;

	layout(location = 0, index = 0) out vec4 out_frag_depth[4];

	void main(void)
	{
		vec2 depth_bounds = texture	(tex_depth_bounds, gl_FragCoord.xy).rg;
		
		float depth_near   = -depth_bounds.x;
		float depth_length =  depth_bounds.y - depth_near;
		int   bucket_size  =  KB_SIZE;

		int bucket = int(floor(bucket_size*(gl_FragCoord.z-depth_near)/depth_length));
		if(bucket==bucket_size)
			bucket=bucket_size-1;

		for(int i=0; i<4; i++)
			out_frag_depth[i] = vec4(-1.0f);

		int b2  = bucket/2;
		int b22 = 2*(bucket%2);

		out_frag_depth[b2][b22  ] = -gl_FragCoord.z;
		out_frag_depth[b2][b22+1] =  gl_FragCoord.z;
	}