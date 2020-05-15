//---------------------------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//---------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------
// Implementation of "Bucket (Uniform) Depth Peeling" method as described in
// "Liu et al., "Efficient Depth Peeling via Bucket Sort", High Performance Graphics, 2009".
//
// [Iter][G1] -> 1st Pass (Geometry) executed in each iteration.
//---------------------------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
layout(binding = 0)  uniform 	sampler2DRect in_tex_peel_0;
layout(binding = 1)  uniform 	sampler2DRect in_tex_peel_1;
layout(binding = 2)  uniform 	sampler2DRect in_tex_peel_2;
layout(binding = 3)  uniform 	sampler2DRect in_tex_peel_3;
layout(binding = 10) uniform 	sampler2DRect in_tex_depth_bounds;

// Ouputput Variables
layout(location = 0, index = 0) out vec4 	  out_frag_depth[BUCKET_SIZE/2];
layout(location = 4, index = 0) out vec4 	  out_frag_color[BUCKET_SIZE/2];

void main(void)
{
	// Get pixel depth bounds
	vec2  depth_bounds  = texture (in_tex_depth_bounds, gl_FragCoord.xy).rg;
	float depth_near    = -depth_bounds.x;
	float depth_length  =  depth_bounds.y - depth_near;
	
	// Compute the corresponding bucket index of this fragment
	int bucket  = int(floor(BUCKET_SIZE*(gl_FragCoord.z-depth_near)/depth_length));
		bucket  = min(bucket, BUCKET_SIZE-1);
	int b2  	= bucket/2;
	int b22 	= bucket%2;

	// Get bucket depth bounds
	vec4  bucket_depth_bounds;
	if		(b2==0) bucket_depth_bounds = texture(in_tex_peel_0, gl_FragCoord.xy);
	else if (b2==1) bucket_depth_bounds = texture(in_tex_peel_1, gl_FragCoord.xy);
	else if (b2==2) bucket_depth_bounds = texture(in_tex_peel_2, gl_FragCoord.xy);
	else			bucket_depth_bounds = texture(in_tex_peel_3, gl_FragCoord.xy);

	if(b22 == 1)
		bucket_depth_bounds.rg = bucket_depth_bounds.ba;
	bucket_depth_bounds.r = -bucket_depth_bounds.r;

	// Initialize output buffers
	for(int i=0; i<BUCKET_SIZE/2; i++) {
		out_frag_depth[i] = vec4(-1.0f);
		out_frag_color[i] = vec4(0.0f);
	}

	// Discard fragment since it has been peeled off
	if(gl_FragCoord.z < bucket_depth_bounds.r || gl_FragCoord.z > bucket_depth_bounds.g)
		discard;

	// Perform min-max depth testing (via max blending)	
	b22 *= 2;
	if(gl_FragCoord.z > bucket_depth_bounds.r && gl_FragCoord.z < bucket_depth_bounds.g)
	{ 
		out_frag_depth[b2][b22  ] = -gl_FragCoord.z;
		out_frag_depth[b2][b22+1] =  gl_FragCoord.z;
		return;
	}
	
	// Compute shading for the fragment that has depth equal
	// to the one of the values of the min-max depth buffer
	vec4 color = computePixelColor();
	if (gl_FragCoord.z == bucket_depth_bounds.r) out_frag_color[b2][b22  ] = color;
	else										 out_frag_color[b2][b22+1] = color;
}