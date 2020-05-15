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
// [Iter][S2] -> 2nd Pass (Screen-space) executed in each iteration.
//---------------------------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
uniform int    bucket;
uniform bool   showFrontFragment;

layout(binding = 0) uniform sampler2DRect in_tex_peel_0;
layout(binding = 1) uniform sampler2DRect in_tex_peel_1;
layout(binding = 2) uniform sampler2DRect in_tex_peel_2;
layout(binding = 3) uniform sampler2DRect in_tex_peel_3;

// Output Variables
layout(location = 0, index = 0) out vec4 	  out_frag_color;

// Local Array
vec4 k[BUCKET_SIZE/2];

void main(void)
{
	// Store color values to a local array
	k[0] = texture(in_tex_peel_0, gl_FragCoord.xy);
	k[1] = texture(in_tex_peel_1, gl_FragCoord.xy);
	k[2] = texture(in_tex_peel_2, gl_FragCoord.xy);
	k[3] = texture(in_tex_peel_3, gl_FragCoord.xy);

	// Return the color value of the front or back fragment of a specific bucket
	out_frag_color = unpackUnorm4x8(uint(k[bucket/2][2*(bucket%2) + int(showFrontFragment)]));
}