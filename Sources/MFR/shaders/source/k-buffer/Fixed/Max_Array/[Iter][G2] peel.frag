//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "k+-buffer (max array)" method as described in 
// "Vasilakis, Fudos, k+-buffer: Fragment Synchronized k-buffer, I3D, 2014".
//
// [Iter][G2] -> 2nd Pass (Geometry) executed optionally in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

#if NV_interlock
#extension GL_NV_fragment_shader_interlock : enable
	layout(pixel_interlock_unordered) in;
#endif

	layout(binding = 0, r32ui) coherent uniform uimage2DRect  in_image_counter;
	layout(binding = 1, rg32f) coherent uniform  image2DArray in_image_peel_data;
#if !(INTEL_ordering | NV_interlock)
	layout(binding = 2, r32ui) coherent uniform uimage2DRect  in_image_semaphore;
	// Helpful functions
	bool  semaphoreAcquire() { return  imageAtomicExchange  (in_image_semaphore, ivec2(gl_FragCoord.xy), 1U)==0U;}
	void  semaphoreRelease() {		   imageStore			(in_image_semaphore, ivec2(gl_FragCoord.xy), uvec4(0U));}
#endif
#if multipass
	layout(binding = 3)					uniform sampler2DRect in_tex_depth;
#endif

	int setMaxFromGlobalArray()
	{
		int  id;
		vec3 maxFR = vec3(0.0f,0.0f,-1.0f);
		
		for(int i=KB_SIZE_1n; i>0; i--)
		{
			vec2 peel = imageLoad(in_image_peel_data, ivec3(gl_FragCoord.xy, i)).rg;
			if(maxFR.g < peel.g)
			{
				maxFR.r = peel.r;
				maxFR.g = peel.g;
				maxFR.b = i;
			}
		}

		if(gl_FragCoord.z < maxFR.g)
		{
			id = int(maxFR.b);
			imageStore(in_image_peel_data, ivec3(gl_FragCoord.xy, 0), vec4(maxFR.r, maxFR.g, 0.0f, 0.0f));
		}
		else
			id = 0;

		return id;
	}

	void insertFragmentArrayMax(float color)
	{
		int id = int(imageLoad(in_image_counter, ivec2(gl_FragCoord.xy)).r);
		if(id < KB_SIZE)
		{
			imageStore(in_image_counter, ivec2(gl_FragCoord.xy), uvec4(id+1U, 0U, 0U, 0U));
			id = (id == KB_SIZE_1n) ? setMaxFromGlobalArray() : KB_SIZE_1n-id;
		}
		else
		{
			if(gl_FragCoord.z < imageLoad(in_image_peel_data, ivec3(gl_FragCoord.xy, 0)).g)
				id = setMaxFromGlobalArray();
			else
				return;
		}
		imageStore(in_image_peel_data, ivec3(gl_FragCoord.xy, id), vec4(color, gl_FragCoord.z, 0.0f, 0.0f));
	}

	void main(void)
	{		
#if multipass
		// Discard previously extracted fragments
		if(gl_FragCoord.z <= texture(in_tex_depth, gl_FragCoord.xy).r)
			discard;
#endif
		// Compute the final shading fragment color
		float color = uintBitsToFloat(packUnorm4x8(computePixelColor()));

		// If the incoming fragment depth is less than the current max depth
		if(gl_FragCoord.z < imageLoad(in_image_peel_data, ivec3(gl_FragCoord.xy, 0)).g)
		{
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
					// Store fragment inside the max-array k+-buffer
					insertFragmentArrayMax(color);
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
	}