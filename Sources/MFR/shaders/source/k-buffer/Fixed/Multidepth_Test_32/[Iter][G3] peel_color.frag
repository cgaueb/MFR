//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "k-buffer (multidepth testing - 32bit)" method as described in 
// "Maule et al., Hybrid Transparency, I3D, 2013".
//
// [Iter][G3] -> 3rd Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
layout(binding = 0, r32ui) readonly  uniform  uimage2DArray in_image_peel_depth;

// Output Variables
layout(binding = 1, r32ui) writeonly uniform  uimage2DArray out_image_peel_color;

void main(void)
{
	// Perform binary search in depth buffer to find the index where the shading color will be stored in a seperate buffer
	int  low  = 0, mid;
	int	 high = KB_SIZE_1n;
	uint Zi, zTest = floatBitsToUint(gl_FragCoord.z);

	while(low <= high)
	{
		mid = int(floor(float(high+low)*0.5f));

		Zi  = imageLoad(in_image_peel_depth, ivec3(gl_FragCoord.xy, mid)).r;
		if(Zi == zTest)
		{
			imageStore(out_image_peel_color, ivec3(gl_FragCoord.xy, mid), 
											 uvec4(packUnorm4x8(computePixelColor()),0U,0U,0U));
			break;
		}
		else if(Zi < zTest)
			low  = mid + 1;
		else
			high = mid - 1;
	}
}
