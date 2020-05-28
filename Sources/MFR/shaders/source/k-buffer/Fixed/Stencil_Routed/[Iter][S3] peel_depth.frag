//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "Stencil-routed k-buffer" method as described in 
// "Bavoil, Myres, Deferred Rendering using a Stencil Routed k-Buffer, ShaderX6, 2008".
//
// [Iter][G3] -> 3rd Pass (Screen-space) executed optionally in each iteration, in case multiple
// passes are needed
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
layout(binding = 0) uniform sampler2DMS  in_tex_peel_data;

// Output Variables
layout(location = 0, index = 0) out vec4 out_frag_depth;

void main(void)
{
	// Find the max depth
	float maxZ = 0.0f;
	for (int i=0; i<STENCIL_SIZE; i++)
	{
		float Z = texelFetch(in_tex_peel_data, ivec2(gl_FragCoord.xy), i).g;
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