//---------------------------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//---------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------
// Implementation of "Dual Depth Peeling" method as described in
// "Bavoil, Myers, Order Independent Transparency with Dual Depth Peeling, Tech. rep., Nvidia Corporation, 2008".
//---------------------------------------------------------------------------------------------------------------

#include "version.h"

// Output Variables
layout(location = 0, index = 0) out vec4 out_frag_depth;

void main(void)
{
	// Initialize min-max depth buffer (via max blending)
	out_frag_depth.xy = vec2(-gl_FragCoord.z, gl_FragCoord.z);
}