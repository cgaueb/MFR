//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "k+-buffer (max array)" method as described in 
// "Vasilakis, Fudos, k+-buffer: Fragment Synchronized k-buffer, I3D, 2014".
//
// [Iter][S1] -> 1st Pass (Screen-space) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Output Variables
layout(binding = 1, rg32f) writeonly uniform image2DArray out_image_peel_data;

void main(void)
{
	// Initialize depth value of the max fragment
	imageStore(out_image_peel, ivec3(gl_FragCoord.xy, 0), vec4(1.0f));
}