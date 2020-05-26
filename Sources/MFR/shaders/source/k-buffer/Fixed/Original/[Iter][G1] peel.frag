//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "k-buffer" method as described in "Bavoil et al., Multi-fragment Effects on
// the GPU Using the k-buffer, I3D, 2007".
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

	// Store color values of coplanar fragments to a local array
	vec4 k[KB_SIZE];
	for(int i=0; i<KB_SIZE; i++)
		k[i] = texelFetch(in_tex_peel_data, ivec3(gl_FragCoord.xy, i), 0);

	// Compute and store the final shading color among with its depth value
	vec2 value = vec2(uintBitsToFloat(packUnorm4x8(computePixelColor())), gl_FragCoord.z);

	// Sort and store the fragment
	vec2 temp;
	for(int i=0; i<KB_SIZE; i++)
		if(value.g <= k[i].g)
		{
			temp    = value;
			value   = k[i].rg;
			k[i].rg = temp;
		}
	
	// Store the updated local array back to the global buffer
	for(int i=0; i<KB_SIZE; i++)
		out_frag_color[i] = k[i];
}