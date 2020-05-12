//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "Front-to-back Depth Peeling" method as described in
// "Everitt, Interactive Order-Independent Transparency, Tech. rep., Nvidia Corporation, 2001".
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
layout(binding  = 0) uniform 	sampler2DRect	in_tex_depth;

// Output Variables
layout(depth_greater) 			out float 		gl_FragDepth;
layout(location = 0, index = 0) out vec4  		out_frag_color;

void main(void)
{
	// Discard previously extracted fragments, producing the next nearest layer underneath
	if(gl_FragCoord.z <= texture (in_tex_depth, gl_FragCoord.xy).r)
		discard;

	// Compute and return the final shading color
	out_frag_color = computePixelColor();
}