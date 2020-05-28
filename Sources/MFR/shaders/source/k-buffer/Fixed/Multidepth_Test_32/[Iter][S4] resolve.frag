//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "k-buffer (multidepth testing - 32bit)" method as described in 
// "Maule et al., Hybrid Transparency, I3D, 2013".
//
// [Iter][S4] -> 4th Pass (Screen-space) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
uniform int layer;
layout(binding = 1, r32ui) readonly uniform uimage2DArray in_image_peel_color;

// Output Variables
layout(location = 0, index = 0) out vec4 out_frag_color;

void main(void)
{
	// Return the color value of the specific fragment
	out_frag_color = unpackUnorm4x8(imageLoad(in_image_peel_color, ivec3(gl_FragCoord.xy, layer), 0).r);
}
