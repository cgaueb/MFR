// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou

#version 440 core

in float pecsZ;
flat in int cube_index;

layout(binding = 2, r32ui)  coherent uniform uimage2DArray image_depth_bounds;

void  setPixelFragMinDepth (int index, uint Z) { imageAtomicMin (image_depth_bounds, ivec3(gl_FragCoord.xy, index + 0), Z); }
void  setPixelFragMaxDepth (int index, uint Z) { imageAtomicMax (image_depth_bounds, ivec3(gl_FragCoord.xy, index + 1), Z); }

void main(void)
{
	uint  Z = floatBitsToUint(-pecsZ); 

	int index = cube_index * 2;
	setPixelFragMinDepth (index, Z);
	setPixelFragMaxDepth (index, Z);
}
