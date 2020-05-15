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
// [Init][G1] -> 1st Pass (Geometry) executed once at the initialization stage.
//---------------------------------------------------------------------------------------------------------------

#include "version.h"

// Output Variables
layout(location = 0, index = 0) out vec4 out_frag_depth;

void main(void)
{
	// Compute pixel depth bounds (via max blending)
	out_frag_depth.xy = vec2(-gl_FragCoord.z, gl_FragCoord.z);
}