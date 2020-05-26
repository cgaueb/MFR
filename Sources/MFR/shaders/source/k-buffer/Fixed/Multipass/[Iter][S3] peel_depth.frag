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
// [Iter][S3] -> 3rd Pass (Screen-space) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
layout(binding = 0) uniform sampler2DRect in_tex_peel_data;

// Output Variables
layout(location = 0, index = 0) out vec4  out_frag_depth;

void main(void)
{
	// Find the max depth
	float maxZ = 0.0f;
	for (int i=0; i<KB_SIZE; i++)
	{
		float Z = texelFetch(in_tex_peel_data, ivec3(gl_FragCoord.xy, i), 0).g;
		if(Z == 1.0f)
		{
			maxZ = 1.0f;
			break;
		}
		else if(Z > maxZ)
			maxZ = Z;
	}

	// Return the max depth
	out_frag_depth.r = maxZ;
}