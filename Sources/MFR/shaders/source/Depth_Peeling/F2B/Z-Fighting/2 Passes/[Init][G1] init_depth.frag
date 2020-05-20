//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "Z-fighting-free Front-to-back Depth Peeling (with 2 geometry passes)" 
// method as described in "Vasilakis and Fudos, Depth-Fighting Aware Methods for Multifragment
// Rendering, TVCG, 2013".
//
// [Init][G1] -> 1st Pass (Geometry) executed once at the initialization stage.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Output Variables
layout(location = 0, index = 0) out vec4 out_frag_depth;

void main(void)
{
	// Initialize min depth buffer (via max blending)
	out_frag_depth.r = -gl_FragCoord.z;
}