// DIRT: Deferred Image-based Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
// This file contains the fragment implementation for the optional Direct Visibility pass
// This is a standard rasterization pass. However, since it is stored in the shading buffer and a Z-buffer is not available at the current implementation,
// a spinlock mechanism is used. In an NVIDIA Maxwell architecture, the GL_NV_fragment_shader_interlock can be used. This is not a requirement though.
// Note: This pass should NOT use conservative rasterization due to the attribute extrapolation problem, since interpolated values if the primitive does not cover the center of the pixel
// Note 2: There is a chance that the spinlock mechanism will cause a deadlock on NVIDIA GPUs.

#version 440 core
#include "data_structs.h"
#define NV_INTERLOCK
#ifdef	NV_INTERLOCK
#extension GL_NV_fragment_shader_interlock : enable
#endif

#include "data_structs.h"

#define NUM_CUBEMAPS			__NUM_FACES__
#define BUCKET_SIZE				__BUCKET_SIZE__
#define BUCKET_SIZE_1n			BUCKET_SIZE - 1

in vec3 pecs;													// the incoming eye space position
uniform vec4	uniform_viewport;								// the viewport dimensions

layout(binding = 0, std430)		coherent buffer  LL_SHADING	 { NodeTypeShadingBuffer nodes_shading []; };		// the hit buffer head id texture
#ifdef NV_INTERLOCK
layout(binding = 1, r32ui)		coherent uniform uimage2DArray semaphore;										// the spinlock texture
#endif // NV_INTERLOCK

void main(void)
{	
	// fetch incoming data, perform texture fetches, etc
	// ...
	
	// store each 3-point pair sequentially. the current point is stored at G1, serving as the ray start direction
	uvec2	dimensions = uvec2(uniform_viewports.zw);
	uvec2	frag = uvec2(floor(gl_FragCoord.xy));
	uint resolve_index = uint(frag.y * dimensions.x + frag.x) * 3 + 1u;
	
#ifdef NV_INTERLOCK
	beginInvocationInterlockNV();
#else
		uint d = floatBitsToUint(pecsZ);
		if (imageAtomicMin(semaphore, ivec3(gl_FragCoord.xy, 1), d) >= d)
#endif // NV_INTERLOCK
		{
			//<critical section>
			// store these values in the second position of the shading buffer
			nodes_shading[resolve_index].position.xyz = pecs;
			// the last channel stores the cube index. The assumption here is that the front face of the cubemap contains the current point. If this is not a case (larger field of view), an iteration through all views is required to obtain the correct view
			nodes_shading[resolve_index].position.w = 0;
			
			// example values!!!
			nodes_shading[resolve_index].albedo	  = packUnorm4x8(vec4(1,0,0,0));
			nodes_shading[resolve_index].normal	  = packUnorm4x8(vec4(1,0,0,0));
			nodes_shading[resolve_index].specular = packUnorm4x8(vec4(1,0,0,0));
		}

#ifdef NV_INTERLOCK
	endInvocationInterlockNV();
#endif // NV_INTERLOCK

}