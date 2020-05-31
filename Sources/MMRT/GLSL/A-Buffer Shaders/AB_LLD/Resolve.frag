// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou

#version 440 core
#include "data_structs.h"
#include "sort.h"

// head tail pointers
layout(binding = 0, r32ui)		coherent uniform uimage2DArray image_pointers;
// Data buffer
layout(binding = 1, std430)		coherent buffer  LINKED_LISTS_DOUBLE  { NodeTypeDataLL_Double nodes[]; };

uint getPixelHeadID  (				) { return	imageLoad (image_pointers, ivec3(gl_FragCoord.xy, 0)).x; }
uint getPixelTailID  (				) { return	imageLoad (image_pointers, ivec3(gl_FragCoord.xy, 1)).x; }
void setPixelTailID	 (const uint val) {			imageStore(image_pointers, ivec3(gl_FragCoord.xy, 1), uvec4(val,0u,0u,0u));}
void setPixelHeadID	 (const uint val) {			imageStore(image_pointers, ivec3(gl_FragCoord.xy, 0), uvec4(val,0u,0u,0u));}
	
void main(void)
{
	uint init_index = getPixelHeadID();
	if(init_index == 0U) return;
	
	// 1. LOAD
	int  counter=0;
	uint index = init_index;
	while(index != 0U && counter < ABUFFER_GLOBAL_SIZE)
	{
		fragments_id[counter] = index;
		fragments_depth[counter] = nodes[index].depth;
		index	= nodes[index].next;
		counter++;
	}

	// 2. SORT
	sort(counter);

	// 3. HEAD TAILS
	setPixelHeadID(fragments_id[0]);
	setPixelTailID(fragments_id[counter-1]);
		
	// 4. NEXT
	for(int i=0; i<counter-1; i++)
		nodes[fragments_id[i]].next = fragments_id[i+1];
	nodes[fragments_id[counter-1]].next = 0U;

	// 5. PREV
	for(int i=counter-1; i>0; i--)
		nodes[fragments_id[i]].prev = fragments_id[i-1];
	nodes[fragments_id[0]].prev = 0U;
}