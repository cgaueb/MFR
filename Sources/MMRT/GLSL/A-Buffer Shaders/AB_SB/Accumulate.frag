// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou

#version 440 core

layout(binding = 0, r32ui) coherent uniform uimage2D image_counter;
layout(binding = 4, offset = 0)	    uniform atomic_uint total_counter;

void addPixelFragCounter() {imageAtomicAdd(image_counter, ivec2(gl_FragCoord.xy), 1U);}

void main(void)
{
	atomicCounterIncrement(total_counter);
	addPixelFragCounter();
}