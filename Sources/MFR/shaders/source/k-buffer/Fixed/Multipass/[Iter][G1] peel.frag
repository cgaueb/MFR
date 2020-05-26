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
// [Iter][G1] -> 1nd Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
layout(binding = 0) uniform sampler2DArray 	in_tex_peel_data;
#if multipass
layout(binding = 1) uniform sampler2DRect  	in_tex_depth;
#endif

// Output Variables	
layout(location = 0, index = 0) out vec4 	out_frag_color[KB_SIZE];

void main(void)
{
#if multipass
	// Discard previously extracted fragments
	if(gl_FragCoord.z <= texture(tex_depth, gl_FragCoord.xy).r)
		discard;
#endif

	// Store fragment data values to a local array
	vec4 k[KB_SIZE];
	for(int i=0; i<KB_SIZE; i++)
		k[i] = texelFetch(in_tex_peel_data, ivec3(gl_FragCoord.xy, i), 0);
   
	// If fragment is already stored then discard
	for(int i=0; i<KB_SIZE; i++)
		if(gl_FragCoord.z == k[i].g)
			discard;

	// Find max fragment in the k-buffer
	int   max_index = -1;	
	float max_depth = -1.0f;
	for(int i=0; i<KB_SIZE; i++)
		if(k[i].g > max_depth)
		{
			max_index = i;
			max_depth = k[i].g;
		}
	
	// If fragment has larger depth than the one in the k-buffer then discard it
	if(gl_FragCoord.z >= max_depth)
		discard;
	else
		// Compute and store the final shading color among with its depth value
		k[max_index] = vec4(uintBitsToFloat(packUnorm4x8(computePixelColor())), gl_FragCoord.z, 0.0f, 0.0f);

	// Store the updated local array back to the global buffer
	for(int i=0; i<KB_SIZE; i++)
		out_frag_color[i] = k[i];
}