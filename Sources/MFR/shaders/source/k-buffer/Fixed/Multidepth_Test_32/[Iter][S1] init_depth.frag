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
// [Iter][S1] -> 1st Pass (Screen-space) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Output Variables
layout(binding = 0, r32ui) writeonly uniform uimage2DArray out_image_peel_depth;

void main(void)
{
	// Initialize depth buffer to MAX_UINT
	for(int i=0; i<KB_SIZE; i++)
		imageStore(out_image_peel_depth, ivec3(gl_FragCoord.xy, i), uvec4(0xFFFFFFFFU,0U,0U,0U));
}