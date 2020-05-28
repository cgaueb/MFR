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
// [Iter][G2] -> 2nd Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"
#extension GL_NV_shader_atomic_int64 : enable

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
uniform int	width;
layout(binding = 0, std430)	coherent buffer KB_MDT_64 { uint64_t nodes[]; };

// Help Functions
uint hi32(const uint64_t val) { return uint(val>>32); }

void main(void)
{
	// Converts and pack color and depth values to a 'uint64_t' variable
	uint 					C_32 = packUnorm4x8(computePixelColor());
	uint zOld_32, zTest_32, Z_32 = floatBitsToUint(gl_FragCoord.z);
	uint64_t zOld_64,   zTest_64 = packUint2x32 (uvec2(C_32, Z_32));

	// Perform insertion sort of incoming fragmetns using their depth value
	int index = (int(gl_FragCoord.x) + width*int(gl_FragCoord.y))*KB_SIZE;
	for(int i=0; i<KB_SIZE; i++)
	{
		zOld_64 = atomicMin (nodes[index + i], zTest_64);
		zOld_32 = hi32(zOld_64); zTest_32 = hi32(zTest_64);
		if (zOld_32 == 0xFFFFFFFFU || zOld_32 == zTest_32)
			break;
		else if (zOld_32 > zTest_32)
			zTest_64 = zOld_64;
	}
}