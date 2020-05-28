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
// [Iter][G2] -> 2nd Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
layout(binding = 0, r32ui) coherent uniform uimage2DArray in_image_peel_depth;

void main(void)
{
	// Perform insertion sort of incoming fragmetns using depth value
	uint zOld, zTest = floatBitsToUint(gl_FragCoord.z);
	for(int i=0; i<KB_SIZE; i++)
	{
		zOld = imageAtomicMin(in_image_peel_depth, ivec3(gl_FragCoord.xy, i), zTest);
		if (zOld == 0xFFFFFFFFU || zOld == zTest)
			break;
		zTest = max(zOld, zTest);
	}
}