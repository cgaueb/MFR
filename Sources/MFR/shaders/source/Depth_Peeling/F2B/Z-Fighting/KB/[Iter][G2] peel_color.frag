//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "Z-fighting-free Front-to-back Depth Peeling (with K-buffer)" 
// method as described in "Vasilakis and Fudos, Depth-Fighting Aware Methods for Multifragment
// Rendering, TVCG, 2013".
//
// [Iter][G2] -> 2nd Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables	
layout(binding = 0) uniform  sampler2DArray in_tex_peel_color;
layout(early_fragment_tests) in;

// Output Variables	
layout(location = 0, index = 0) out  vec4 	out_frag_color[KB_SIZE];

void main(void)
{
	// Store color values of coplanar fragments to a local array
	vec4 k[KB_SIZE];
	for(int i=0; i<KB_SIZE; i++)
		k[i] = texelFetch(in_tex_peel_color, ivec3(gl_FragCoord.xy, i), 0);

	// Find a empty location in buffer
	int j=0;
	while(j<KB_SIZE && k[j].a != 0.0f)
		j++;
	k[j] = computePixelColor();

	// Store the updated local array back to the global buffer
	for(int i=0; i<KB_SIZE; i++)
		out_frag_color[i] = k[i];
}