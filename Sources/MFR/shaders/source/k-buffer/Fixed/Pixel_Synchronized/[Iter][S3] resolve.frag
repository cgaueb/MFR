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
// [Iter][S3] -> 3rd Pass (Screen-space) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
uniform int layer;
layout(binding = 0, rg32f) readonly uniform image2DArray in_image_peel_data;

// Output Variables
layout(location = 0, index = 0) out  vec4 out_frag_color;

void main(void)
{
	out_frag_color = unpackUnorm4x8(floatBitsToUint(imageLoad(in_image_peel_data, ivec3(gl_FragCoord.xy, layer)).r));
}