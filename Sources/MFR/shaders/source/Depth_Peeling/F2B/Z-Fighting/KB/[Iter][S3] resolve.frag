//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "Z-fighting-free Front-to-back Depth Peeling (with K-buffer)" 
// method as described in "Vasilakis and Fudos, Depth-Fighting Aware Methods for Multifragment
// Rendering, TVCG, 2013".
//
// [Iter][S3] -> 3rd Pass (Screen-space) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
uniform int    coplanar_fragment;

layout(binding = 0) uniform sampler2DArray in_tex_peel_color;

// Output Variables
layout(location = 0, index = 0) out vec4   out_frag_color;

void main(void)
{
	// Return the color value of the specific coplanar fragment
	out_frag_color = texelFetch(in_tex_peel_color, ivec3(gl_FragCoord.xy, coplanar_fragment), 0);
}