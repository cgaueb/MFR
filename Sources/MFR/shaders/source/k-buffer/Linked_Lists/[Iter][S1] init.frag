//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "k-buffer using Linked-Lists" method as described in 
// "Yu et al., A Framework for Rendering Complex Scattering Effects on Hair, I3D, 2012".
//
// [Iter][S1] -> 1st Pass (Screen-space) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
uniform int width_2;

// Output Variables
layout(binding = 1, r32ui) writeonly uniform uimageBuffer out_image_pointers;
layout(binding = 4, rg32f) writeonly uniform  imageBuffer out_image_peel_data;

void main(void)
{
	// Initialize pointer nodes
	uint  P_ID, ID = uint(gl_FragCoord.x + width_2*gl_FragCoord.y) * 2U + 1U;

	// Tail node
	{
		P_ID = ID;

		imageStore(out_image_pointers , int(P_ID), uvec4(0U  , 0U  , 0U  , 0U  ));
		imageStore(out_image_peel_data, int(P_ID),  vec4(0.0f, 1.0f, 0.0f, 0.0f));
	}

	// Head node
	{
		P_ID = ID + 1U;

		imageStore(out_image_pointers , int(P_ID), uvec4(ID  , 0U  , 0U  , 0U  ));
		imageStore(out_image_peel_data, int(P_ID),  vec4(0.0f, 0.0f, 0.0f, 0.0f));
	}
}
