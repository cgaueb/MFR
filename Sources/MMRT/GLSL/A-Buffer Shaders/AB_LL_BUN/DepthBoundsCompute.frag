// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou

#version 440 core

in float pecsZ;

layout(binding = 1, r32ui)  coherent uniform uimage2DArray image_depth_bounds;

void  setPixelFragMinDepth (uint Z) { imageAtomicMin (image_depth_bounds, ivec3(gl_FragCoord.xy, 0), Z); }
void  setPixelFragMaxDepth (uint Z) { imageAtomicMax (image_depth_bounds, ivec3(gl_FragCoord.xy, 1), Z); }

void main(void)
{
	uint  Z = floatBitsToUint(-pecsZ); 

	setPixelFragMinDepth (Z);
	setPixelFragMaxDepth (Z);
}