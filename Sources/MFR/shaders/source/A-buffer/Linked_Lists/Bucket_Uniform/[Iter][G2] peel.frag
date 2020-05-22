//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "A-buffer using multiple linked lists (one per uniform bucket)" method as
// described in "Vasilakis and Fudos, Depth-Fighting Aware Methods for Multifragment Rendering, 
// TVCG, 2013".
//
// [Iter][G2] -> 2nd Pass (Geometry) executed once.
//-----------------------------------------------------------------------------------------------

#include "define.h"
#include "data_structs.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

layout(binding = 0, r32ui  ) readonly  uniform uimage2DArray	in_tex_depth_bounds;
layout(binding = 1, r32ui  ) coherent  uniform uimage2DArray	in_image_heads;
layout(binding = 2, std430 ) coherent  buffer  LinkedLists    { NodeTypeLL nodes[]; };
layout(binding = 3, offset = 0)		   uniform atomic_uint		in_next_address;

float getPixelFragDepthMin		(								 )	{ return uintBitsToFloat	(imageLoad (image_min_max, ivec3(gl_FragCoord.xy, 0)).r);}
float getPixelFragDepthMax		(								 )	{ return uintBitsToFloat	(imageLoad (image_min_max, ivec3(gl_FragCoord.xy, 1)).r);}
uint  exchangePixelCurrentPageID(const int  b	 , const uint val)	{ return imageAtomicExchange(image_next				 , ivec3(gl_FragCoord.xy, b), val);}

void main(void)
{
	// Get the next available location in the global buffer
	uint index = atomicCounterIncrement(in_next_address) + 1U;

	// Check for memory overflow
	if(	 index < nodes.length())
	{
		// Find bucket that each fragment falls into
		float	depth_near   = uintBitsToFloat(imageLoad(in_tex_depth_bounds, ivec3(gl_FragCoord.xy, 0)).r);
		float	depth_far    = uintBitsToFloat(imageLoad(in_tex_depth_bounds, ivec3(gl_FragCoord.xy, 1)).r);
		float	depth_length = depth_far - depth_near;
		int		bucket		 = int((float(BUCKET_SIZE)*((gl_FragCoord.z-depth_near)/depth_length))); 
		 		bucket 		 = min(bucket, BUCKET_SIZE-1);

		// Compute the shading color of each incoming fragment
		vec4 color = computePixelColor();

		// Store fragment data into the global buffer
		nodes[index].color = packUnorm4x8(color);
		nodes[index].depth = gl_FragCoord.z;
		// Connect fragment with head of the fragment list and then set it as the new head
		nodes[index].next  = imageAtomicExchange(in_image_heads, ivec3(gl_FragCoord.xy, bucket), index);

		// Used for memory counting of overflowed fragments
		discard;
	}
}