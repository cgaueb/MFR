// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou

#version 440 core
#include "s-buffer.h"

layout(binding = 0, r32ui ) readonly  uniform uimage2D  image_counter;
layout(binding = 1, r32ui ) writeonly uniform uimage2D  image_head;
layout(binding = 4, std430)	coherent  buffer  ADDRESS_MAP {uint head_s[];};

void setPixelHeadAddress  (		  uint val) {			imageStore	(image_head		, ivec2(gl_FragCoord.xy), uvec4(val, 0U, 0U, 0U) );}
uint getPixelFragCounter  (				  ) { return	imageLoad   (image_counter	, ivec2(gl_FragCoord.xy)).x ;}
uint addSharedHeadAddress (int j, uint val) { return	atomicAdd	(head_s[j], val);}
	
void main(void)
{
	uint counter = getPixelFragCounter();
	if(counter == 0U) return;

	int  hash_id = hashFunction(ivec2(gl_FragCoord.xy));
	uint address = addSharedNextAddress (hash_id, counter);	
	setPixelHeadAddress (address);
}