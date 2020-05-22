//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "A-buffer using Variable Arrays" method as described in 
// "Vasilakis and Fudos, S-buffer: Sparsity-aware multifragment rendering, EG (Short Papers), 2012".
//
// [Iter][G1] -> 1st Pass (Geometry) executed once.
//-----------------------------------------------------------------------------------------------

#include "define.h"
#include "s-buffer.h"

// Input Variables
layout(binding = 0, r32ui) coherent uniform uimage2DRect in_image_counter;

void main(void)
{
	// Accumulate fragments per pixel
	imageAtomicAdd(in_image_counter, ivec2(gl_FragCoord.xy), 1U);
}