//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "k+-buffer (max heap)" method as described in 
// "Vasilakis, Fudos, k+-buffer: Fragment Synchronized k-buffer, I3D, 2014".
//
// [Iter][G1] -> 1st Pass (Geometry) executed optionally in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
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

	int   parentHeap(const int j) {return (j-1) >> 1;}
	int   leftHeap	(const int j) {return (j<<1) + 1;}

	void maxHeapify(float color, float Zo)
	{
		if(Zo >= imageLoad(in_image_peel_data, ivec3(gl_FragCoord.xy, 0)).g)
			return;

		int    P;
		int	   I = 0;
		int    L = 1;
		int    R = 2;

		vec4  Zl = imageLoad(in_image_peel_data, ivec3(gl_FragCoord.xy, L));
		vec4  Zr = imageLoad(in_image_peel_data, ivec3(gl_FragCoord.xy, R));

		for (int i=0; i<KB_SIZE_LOG2; i++)
		{
			float Z = Zo;
			if(L < KB_SIZE && Z < Zl.g)
			{
				P = L;
				Z = Zl.g;
			}
			else
				P = I;

			if(R < KB_SIZE && Z < Zr.g)
				P = R;

			if(P != I)
			{
				imageStore(in_image_peel_data, ivec3(gl_FragCoord.xy, I), 
					imageLoad(in_image_peel_data, ivec3(gl_FragCoord.xy, P))
				);

				I = P; 
				L = leftHeap(I);	Zl = imageLoad(in_image_peel_data, ivec3(gl_FragCoord.xy, L));
				R = L + 1;			Zr = imageLoad(in_image_peel_data, ivec3(gl_FragCoord.xy, R));
			}
			else
				break;
		}
		imageStore(in_image_peel_data, ivec3(gl_FragCoord.xy, I), vec4(color, Zo, 0.0f, 0.0f));
	}

	void insertFragmentHeap(float color)
	{
		int counter = int(imageLoad(in_image_counter, ivec2(gl_FragCoord.xy)).r);

		if (counter == KB_SIZE)
			maxHeapify(color, gl_FragCoord.z);
		else
		{
			int i = counter;
			int p = parentHeap(i);

			vec4 Zp;
			while (i > 0 && gl_FragCoord.z > (Zp = imageLoad(in_image_peel_data, ivec3(gl_FragCoord.xy, p))).g)
			{
				imageStore(in_image_peel_data, ivec3(gl_FragCoord.xy, i), Zp);
				i = p;
				p = parentHeap(i);
			}

			imageStore(in_image_peel_data, ivec3(gl_FragCoord.xy, i),  vec4(color, gl_FragCoord.z, 0.0f, 0.0f));
			imageStore(in_image_counter  , ivec2(gl_FragCoord.xy   ), uvec4(uint(counter)+1U, 0U, 0U, 0U));
		}
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
		if(KB_SIZE        > imageLoad(in_image_counter  , ivec2(gl_FragCoord.xy)).r    ||
		   gl_FragCoord.z < imageLoad(in_image_peel_data, ivec3(gl_FragCoord.xy, 0)).g)
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
					// Store fragment inside the max-heap k+-buffer
					insertFragmentHeap(color);
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