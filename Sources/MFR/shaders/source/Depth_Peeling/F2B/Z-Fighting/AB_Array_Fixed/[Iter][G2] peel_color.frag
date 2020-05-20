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
// [Iter][G2] -> 2nd Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
layout(binding = 0, r32ui ) coherent uniform uimage2DRect  in_image_counter;
layout(binding = 1, rgba8 ) coherent uniform image2DArray  in_image_peel_color;

layout (early_fragment_tests) in;

void main(void)
{
	// Compute the shading color of each coplanar fragment
	vec4  color = computePixelColor();
	// Increment coplanarity size and get the next array location
	int   index = int(imageAtomicAdd(in_image_counter, ivec2(gl_FragCoord.xy), 1u));
	// Store fragment color
	imageStore(in_image_peel_color, ivec3(gl_FragCoord.xy, index), color);
}