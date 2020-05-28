//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "k-buffer (multidepth testing - 32bit)" method as described in 
// "Kubish, Order Independent Transparency In OpenGL 4.x., GTC, 2014".
//
// [Iter][S1] -> 1th Pass (Screen-space) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
uniform int width;
layout(binding = 0, std430)	writeonly buffer KB_MDT_64 { uint64_t nodes[]; };

void main(void)
{
	// Initialize buffer nodes to zero 
	int 	 index  = (int(gl_FragCoord.x) + width*int(gl_FragCoord.y))*KB_SIZE;
	uint64_t zero64 = uint64_t(0xFFFFFFFF) << 32;
	for(int i=0; i<KB_SIZE; i++)
		nodes[index + i] = zero64;
}