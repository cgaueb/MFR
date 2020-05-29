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
// [Iter][S3] -> 3rd Pass (Screen-space) executed optionally in each iteration, in case multiple
// passes are needed
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
layout(binding = 0) uniform sampler2DRect in_tex_peel_data;

// Output Variables
layout(location = 0, index = 0) out vec4  out_frag_depth;

void main(void)
{
	out_frag_depth.r = texture(in_tex_peel_data, gl_FragCoord.xy).g;
}