//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "k-buffer (pixel synchronized)" method as described in 
// "Salvi, Advances in Real-Time Rendering in Games: Pixel Synchronization: Solving old graphics 
// problems with new data structures", SIGGRAPH Courses, 2013".
//
// [Iter][G2] -> 2nd Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
#if NV_interlock
#extension GL_NV_fragment_shader_interlock : enable
layout(pixel_interlock_unordered) in;
#endif

layout(binding = 0, rg32f) coherent uniform image2DArray in_image_peel_data;
#if !(INTEL_ordering | NV_interlock)
layout(binding = 1, r32ui) coherent uniform uimage2DRect in_image_semaphore;
// Helpful functions
bool  semaphoreAcquire() { return (imageLoad (image_semaphore, ivec2(gl_FragCoord.xy)).r == 1U) ? false :
									imageAtomicExchange (image_semaphore, ivec2(gl_FragCoord.xy), 1U)==0U; }
void  semaphoreRelease() {		   imageStore(image_semaphore, ivec2(gl_FragCoord.xy), uvec4(0U));}
#endif 

void insertFragmentArrayIns(float C)
{
	float _Z = gl_FragCoord.z;
	float _C = C;

	for(int i=0; i<KB_SIZE; i++)
	{
		vec2 Zi = imageLoad(in_image_peel_data, ivec3(gl_FragCoord.xy, i)).rg;
		if(_Z <= Zi.g)
		{
			vec2 temp = vec2(_C, _Z);
			_C = Zi.r; _Z = Zi.g;
			imageStore(in_image_peel_data, ivec3(gl_FragCoord.xy, i), vec4(temp.r, temp.g, 0.0f, 0.0f));
		}
	}
}

void main(void)
{		
	// Compute the final shading fragment color
	float color = uintBitsToFloat(packUnorm4x8(computePixelColor()));

	// Enter critical section
#if		INTEL_ordering
	beginFragmentShaderOrderingINTEL();
#elif	NV_interlock
	beginInvocationInterlockNV();
#else
	int  iter = 0;
	bool stay_loop = true;
	while (stay_loop && iter++ < MAX_ITERATIONS)
	{
		if (semaphoreAcquire())
		{
#endif
			// Sort the fragment inside k-buffer
			insertFragmentArrayIns(color);
			
#if		!(INTEL_ordering | NV_interlock)
			semaphoreRelease();
			stay_loop = false;
		}
	}
#endif
#if		NV_interlock
	endInvocationInterlockNV();
#endif
}