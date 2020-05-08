#include "define.h"

	vec4 computePixelColor();

#if multipass
	layout(binding = 0) uniform sampler2DRect tex_peel_0;
	layout(binding = 1) uniform sampler2DRect tex_peel_1;
	layout(binding = 2) uniform sampler2DRect tex_peel_2;
	layout(binding = 3) uniform sampler2DRect tex_peel_3;
#endif
	layout(binding = 10) uniform sampler2DRect tex_depth_bounds;

#if multipass
	layout(location = 0, index = 0) out vec4 out_frag_depth[4];
	layout(location = 4, index = 0) out vec4 out_frag_color[4];
#else
	layout(location = 0, index = 0) out vec4 out_frag_color[8];
#endif

	void main(void)
	{
		vec2 depth_bounds  = texture	 (tex_depth_bounds, gl_FragCoord.xy).rg;
		float depth_near   = -depth_bounds.x;
		float depth_length =  depth_bounds.y - depth_near;
		int   bucket, bucket_size;
	
#if multipass
		vec4  depths;
		bucket_size = KB_SIZE;
		bucket = int(floor(bucket_size*(gl_FragCoord.z-depth_near)/depth_length));
		if(bucket == KB_SIZE)
			bucket = KB_SIZE-1;

		int b2  = bucket/2;
		int b22 = bucket%2;
			
		if		(b2==0) depths = texture(tex_peel_0, gl_FragCoord.xy);
		else if (b2==1) depths = texture(tex_peel_1, gl_FragCoord.xy);
		else if (b2==2) depths = texture(tex_peel_2, gl_FragCoord.xy);
		else			depths = texture(tex_peel_3, gl_FragCoord.xy);
	
		if(b22 == 1)
			depths.rg = depths.ba;
		depths.r = -depths.r;

		for(int i=0; i<4; i++)
		{
			out_frag_depth[i] = vec4(-1.0f);
			out_frag_color[i] = vec4(0.0f);
		}

		if(gl_FragCoord.z < depths.r || gl_FragCoord.z > depths.g)
			discard;
		
		b22 *= 2;
		if(gl_FragCoord.z > depths.r && gl_FragCoord.z < depths.g)
		{ 
			out_frag_depth[b2][b22  ] = -gl_FragCoord.z;
			out_frag_depth[b2][b22+1] =  gl_FragCoord.z;
			return;
		}
		if (gl_FragCoord.z == depths.r) out_frag_color[b2][b22  ] = packUnorm4x8(computePixelColor());
		else							out_frag_color[b2][b22+1] = packUnorm4x8(computePixelColor());
#else
		bucket_size =  KB_SIZE*4;
		bucket 		=  int(floor(bucket_size*(gl_FragCoord.z-depth_near)/depth_length));
		if(bucket   == bucket_size)
			bucket  =  bucket_size-1;

		for(int i=0; i<KB_SIZE; i++)
			out_frag_color[i] = vec4(0.0f);
		out_frag_color[bucket/4][bucket%4] = packUnorm4x8(computePixelColor());
#endif
}