//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "A-buffer using multiple linked lists (one per uniform bucket)" method as
// described in "Vasilakis and Fudos, Depth-Fighting Aware Methods for Multifragment Rendering, 
// TVCG, 2013".
//
// [Iter][G1] -> 1st Pass (Geometry) executed once.
//-----------------------------------------------------------------------------------------------

#include "version.h"

// Output Variables
layout(binding = 0, r32ui) coherent uniform uimage2DArray in_tex_depth_bounds;

void main(void)
{
	// Compute pixel depth bounds
	uint Z = floatBitsToUint(gl_FragCoord.z);
	imageAtomicMin(in_tex_depth_bounds, ivec3(gl_FragCoord.xy, 0), Z);
	imageAtomicMax(in_tex_depth_bounds, ivec3(gl_FragCoord.xy, 1), Z);
}