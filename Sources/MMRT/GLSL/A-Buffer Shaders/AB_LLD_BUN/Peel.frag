// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou

#define BUCKET_SIZE				__BUCKET_SIZE__
#define BUCKET_SIZE_1n			BUCKET_SIZE - 1

#version 440 core
#include "data_structs.h"

in float pecsZ;

layout(binding = 2, r32ui  ) readonly  uniform uimage2DArray		 image_depth_bounds;
layout(binding = 3, std430 ) coherent  buffer  LINKED_LISTS_DOUBLE { NodeTypeDataLL_Double nodes[]; };
layout(binding = 4, offset = 0)		   uniform atomic_uint			 next_address;

float getPixelFragDepthMin		(								 )	{ return uintBitsToFloat	(imageLoad (image_depth_bounds, ivec3(gl_FragCoord.xy, 0)).r);}
float getPixelFragDepthMax		(								 )	{ return uintBitsToFloat	(imageLoad (image_depth_bounds, ivec3(gl_FragCoord.xy, 1)).r);}

layout(binding = 0, r32ui)		coherent uniform uimage2DArray image_head;
uint  exchangePixelCurrentPageID(const int  b	 , const uint val)	{ return imageAtomicExchange(			image_head		  , ivec3(gl_FragCoord.xy, b), val);}

void main(void)
{
	// perform any texture fetches here
	
	uint index = atomicCounterIncrement(next_address) + 1U;
	if (index >= nodes.length()) return;

	// Find Bucket 
	float Z = -pecsZ;
		
	float	depth_near   	= getPixelFragDepthMin();
	float	depth_far   	 = getPixelFragDepthMax();
	float	normalized_depth = (Z - depth_near)/(depth_far - depth_near);
	normalized_depth		= clamp(normalized_depth, 0.0, 1.0);
	int		bucket			= int(floor(float(BUCKET_SIZE)*normalized_depth));		
	bucket					= min(bucket,BUCKET_SIZE_1n);		

	nodes[index].depth		= pecsZ;
	nodes[index].next		= exchangePixelCurrentPageID(bucket, index);
	
	// add shading parameters to buffer
	// nodes[index].albedo	= ...
}