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
// [Iter][S3] -> 3rd Pass (Screen-space) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
uniform int	width;
uniform int layer;
layout(binding  = 0, std430) readonly buffer KB_MDT_64 { uint64_t nodes[]; };

// Output Variables
layout(location = 0, index = 0) out vec4 out_frag_color;

void main(void)
{
	// Return the color value of the specific fragment
	int index 		= (int(gl_FragCoord.x) + width*int(gl_FragCoord.y))*KB_SIZE;
	out_frag_color 	= unpackUnorm4x8(unpackUint2x32(nodes[index + layer]).r);
}
