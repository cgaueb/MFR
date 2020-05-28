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
// [Iter][G1] -> 1st Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
#if multipass
layout(binding = 0) uniform sampler2DRect in_tex_depth;
#endif

// Output Variables	
layout(location = 0, index = 0) out vec4  out_frag_color;

void main(void)
{
#if multipass
	// Discard previously extracted fragments
	if(gl_FragCoord.z <= texture(tex_depth, gl_FragCoord.xy).r)
		discard;
#endif
	
	// Compute and store the final shading color among with its depth value
	out_frag_color = vec4(uintBitsToFloat(packUnorm4x8(computePixelColor())), gl_FragCoord.z, 0.0f, 0.0f);
}