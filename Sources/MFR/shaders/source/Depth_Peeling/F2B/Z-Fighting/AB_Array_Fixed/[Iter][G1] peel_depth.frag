//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "Z-fighting-free Front-to-back Depth Peeling (with A-buffer, Fixed Array)" 
// method as described in "Vasilakis and Fudos, Depth-Fighting Aware Methods for Multifragment
// Rendering, TVCG, 2013".
//
// [Iter][G1] -> 1st Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
layout(binding = 0) uniform sampler2DRect in_tex_depth;

// Output Variables
layout(depth_greater) 		out float 	  gl_FragDepth;

void main(void)
{
	// Discard previously extracted fragments, producing the next nearest layer underneath
	float depth = texture (tex_depth, gl_FragCoord.xy).r;
	if(gl_FragCoord.z <= depth)
		discard;
}