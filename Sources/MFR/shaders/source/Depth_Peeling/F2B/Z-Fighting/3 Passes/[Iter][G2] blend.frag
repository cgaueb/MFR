//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "Z-fighting-free Front-to-back Depth Peeling (with 3 geometry passes)" 
// method as described in "Vasilakis and Fudos, Depth-Fighting Aware Methods for Multifragment
// Rendering, TVCG, 2013".
//
// [Iter][G2] -> 2nd Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Input Variables
layout(binding = 0) uniform 	sampler2DRect in_tex_count;
layout(binding = 1) uniform 	sampler2DRect in_tex_id;

// Output Variables
layout(location = 0, index = 0) out vec4 	  out_frag_id;
layout(location = 1, index = 0) out vec4 	  out_frag_count;

layout (early_fragment_tests) in;

void main(void)
{
	// Initialize output buffers
	out_frag_id.rg   = vec2(float_min, 0.0f);
	out_frag_count.r = 0.0f;

	// Get coplanar fragment IDs and count
	ivec3 IDsCount = ivec3(	texture(in_tex_id   , gl_FragCoord.xy).rg, 
							texture(in_tex_count, gl_FragCoord.xy).r);

	// If the counter is less or equal than 2, then we have extracted all information in this layer
	if( IDsCount.z <= 2 || 
	// Otherwise, discard fragments that have been peeled
	(-IDsCount.x < gl_PrimitiveID && IDsCount.y > gl_PrimitiveID) )
	{
		// Compute minimum and maximum ID of coplanar nonpeeled fragments via max blending
		out_frag_id.rg	   = vec2(-gl_PrimitiveID, gl_PrimitiveID);
		// Count coplanar non-peeled fragments via add blending
		out_frag_count.r = 1.0f;
	}
}