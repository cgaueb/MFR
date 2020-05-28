//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "k-buffer (pixel synchronized)" method as described in 
// "Salvi, Advances in Real-Time Rendering in Games: Pixel Synchronization: Solving old graphics 
// problems with new data structures", SIGGRAPH Courses, 2013".
//
// [Iter][S1] -> 1th Pass (Screen-space) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
layout(binding = 0, rg32f) writeonly uniform image2DArray out_image_peel_data;

void main(void)
{
	// Initialize buffer nodes to one 
	for(int i=0; i<KB_SIZE; i++)
		imageStore(image_peel, ivec3(gl_FragCoord.xy, i), vec4(1.0f));
}