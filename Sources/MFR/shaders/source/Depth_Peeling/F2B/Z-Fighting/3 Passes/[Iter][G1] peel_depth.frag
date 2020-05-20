//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "Z-fighting-free Front-to-back Depth Peeling (with 3 geometry passes)" 
// method as described in "Vasilakis and Fudos, Depth-Fighting Aware Methods for Multifragment
// Rendering, TVCG, 2013".
//
// [Iter][G1] -> 1st Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
layout(binding = 0) uniform sampler2DRect in_tex_depth;
layout(binding = 1) uniform sampler2DRect in_tex_count;

// Output Variables
layout (depth_greater) out float gl_FragDepth;

void main(void)
{
	// Get the next nearest layer underneath if all coplanar fragments have been extracted
	float depth =     texture(in_tex_depth, gl_FragCoord.xy).r;
	int   count = int(texture(in_tex_count, gl_FragCoord.xy).r);
	if ((count <= 2 && gl_FragCoord.z <= depth) || (count > 2 && gl_FragCoord.z != depth))
		discard;
}