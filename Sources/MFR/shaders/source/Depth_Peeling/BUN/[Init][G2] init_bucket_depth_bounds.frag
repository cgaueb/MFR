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
// [Init][G2] -> 2ns Pass (Geometry) executed once at the initialization stage.
//---------------------------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
layout(binding = 0) uniform 	sampler2DRect 	in_tex_depth_bounds;

layout(location = 0, index = 0) out vec4 		out_frag_depth[BUCKET_SIZE/2];

void main(void)
{
	// Get pixel depth bounds
	vec2  depth_bounds = texture	(in_tex_depth_bounds, gl_FragCoord.xy).rg;
	float depth_near   = -depth_bounds.x;
	float depth_length =  depth_bounds.y - depth_near;

	// Compute the corresponding bucket index of this fragment
	int bucket = int(floor(BUCKET_SIZE*(gl_FragCoord.z-depth_near)/depth_length));
	    bucket = min(bucket, BUCKET_SIZE-1);

	// Initialize min-max depth buffer for this bucket (via max blending)
	int b2  = bucket/2;
	int b22 = 2*(bucket%2);
	for(int i=0; i<BUCKET_SIZE/2; i++)
		out_frag_depth[i] = vec4(-1.0f);
	out_frag_depth[b2][b22  ] = -gl_FragCoord.z;
	out_frag_depth[b2][b22+1] =  gl_FragCoord.z;
}