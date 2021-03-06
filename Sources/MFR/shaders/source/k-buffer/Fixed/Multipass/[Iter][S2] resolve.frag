//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "k-buffer (multipass)" method as described in 
// "Liu et al., Multi-layer depth peeling via fragment sort, CAD&CG, 2009".
//
// [Iter][S2] -> 2nd Pass (Screen-space) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
uniform int layer;

layout(binding = 0) uniform  sampler2DArray in_tex_peel_data;

// Output Variables
layout(location = 0, index = 0) out vec4 	out_frag_color;

void main(void)
{
	// Store fragment data values to a local array
	int count=0;
	for(int i=0; i<KB_SIZE; i++)
	{
		vec2 data = texelFetch(in_tex_peel_data, ivec2(gl_FragCoord.xy), i).rg;
		if(data.g == 1.0f)
			break;
		fragments[count++] = data;
	}

	// Sort fragments by their depth
	sort(count);

	// Return the color value of the selected fragment
   	out_frag_color = unpackUnorm4x8(floatBitsToUint(fragments[layer].r));
}