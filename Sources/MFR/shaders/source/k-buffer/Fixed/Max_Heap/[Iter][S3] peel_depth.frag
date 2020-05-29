//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "k+-buffer (max heap)" method as described in 
// "Vasilakis, Fudos, k+-buffer: Fragment Synchronized k-buffer, I3D, 2014".
//
// [Iter][S3] -> 3rd Pass (Screen-space) executed optionally in each iteration, in case multiple
// passes are needed
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
layout(binding = 1, rg32f) readonly uniform image2DArray in_image_peel_data;

// Output Variables
layout(location = 0, index = 0) out vec4 out_frag_depth;

void main(void)
{
	out_frag_depth.r = imageLoad(in_image_peel_data, ivec3(gl_FragCoord.xy, 0)).g;
}