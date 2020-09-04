// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou

#version 440 core
#include "s-buffer.h"

layout(binding = 3, std430)	coherent  buffer  ADDRESS_MAP {uint head_s[];};

void main(void)
{
	int id = int(gl_FragCoord.y);
	if(id < COUNTERS)
	{
#if inverse
		int  k = (id < COUNTERS_2d) ? 0 : COUNTERS_2d;
#else
		int  k = 0;
#endif
		uint sum = 0U;
		for(int i = id; i > k; i--)
			sum += head_s[i-1];
		head_s[id+COUNTERS] = sum;	
	}
}