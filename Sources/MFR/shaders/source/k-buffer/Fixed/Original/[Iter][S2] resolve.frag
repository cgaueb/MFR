//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "k-buffer" method as described in 
// "Bavoil et al., Multi-fragment Effects on the GPU Using the k-buffer, I3D, 2007".
//
// [Iter][G2] -> 2nd Pass (Screen-space) executed optionally in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
uniform int layer;
layout(binding = 0) uniform  sampler2DArray in_tex_peel_data;

// Output Variables
layout(location = 0, index = 0) out vec4 	out_frag_color;

void main(void)
{
	// Return the color value of the specific coplanar fragment
	out_frag_color = unpackUnorm4x8(floatBitsToUint(texelFetch(in_tex_peel_color, ivec3(gl_FragCoord.xy, layer), 0).r));
}