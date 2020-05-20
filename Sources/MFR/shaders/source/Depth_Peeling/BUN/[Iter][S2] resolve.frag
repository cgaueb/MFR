//---------------------------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//---------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------
// Implementation of "Bucket (Uniform) Depth Peeling" method as described in
// "Liu et al., "Efficient Depth Peeling via Bucket Sort", HPG, 2009".
//
// [Iter][S2] -> 2nd Pass (Screen-space) executed in each iteration.
//---------------------------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
uniform int    bucket;
uniform bool   showFrontFragment;

layout(binding = 0) uniform sampler2DArray in_tex_peel_color;

// Output Variables
layout(location = 0, index = 0) out vec4   out_frag_color;

void main(void)
{
	// Return the color value of the front or back fragment of a specific bucket
	vec4 k = texelFetch(in_tex_peel_color, ivec3(gl_FragCoord.xy, bucket/2), 0);
	out_frag_color = unpackUnorm4x8(uint(k[2*(bucket%2) + int(showFrontFragment)]));
}