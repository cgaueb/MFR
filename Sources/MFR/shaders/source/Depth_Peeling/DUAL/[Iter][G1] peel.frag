//---------------------------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//---------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------
// Implementation of "Dual Depth Peeling" method as described in
// "Bavoil, Myers, Order Independent Transparency with Dual Depth Peeling, Tech. rep., Nvidia Corporation, 2008".
//
// [Iter][G1] -> 1st Pass (Geometry) executed in each iteration.
//---------------------------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
layout(binding = 0) uniform 	sampler2DRect 	in_tex_depth_min_max;

// Output Variables
layout(location = 0, index = 0) out vec4 		out_frag_depth;
layout(location = 1, index = 0) out vec4 		out_frag_color_front;
layout(location = 2, index = 0) out vec4 		out_frag_color_back;

void main()
{
	// Get min-max depth values
	vec2  depth 	 = texture(in_tex_depth_min_max, gl_FragCoord.xy).rg;
	float depth_near = -depth.x;
	float depth_far	 =  depth.y;

	// Initialize output buffers
	out_frag_color_front = vec4(0.0);
	out_frag_color_back  = vec4(0.0);
	out_frag_depth.xy	 = vec2(-1.0f);

	// Discard fragment since it has been peeled off
	if (gl_FragCoord.z < depth_near || gl_FragCoord.z > depth_far)
		discard;
	
	// Perform min-max depth testing (via max blending)
	else if (gl_FragCoord.z > depth_near && gl_FragCoord.z < depth_far)
	{ 
		out_frag_depth.xy = vec2(-gl_FragCoord.z, gl_FragCoord.z);
		return;
	}

	// Compute shading for the fragment that has depth equal
	// to the one of the values of the min-max depth buffer
	vec4 color = computePixelColor();
	if (gl_FragCoord.z == depth_near) out_frag_color_front = color;
	else							  out_frag_color_back  = color;
}