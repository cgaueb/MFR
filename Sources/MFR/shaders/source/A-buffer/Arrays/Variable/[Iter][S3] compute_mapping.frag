//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "A-buffer using Variable Arrays" method as described in 
// "Vasilakis and Fudos, S-buffer: Sparsity-aware multifragment rendering, EG (Short Papers), 2012".
//
// [Iter][S3] -> 3rd Pass (Screen-space) executed once.
//-----------------------------------------------------------------------------------------------

#include "define.h"
#include "s-buffer.h"

// Input/Output Variables
layout(binding = 3, std430)	coherent  buffer  ADDRESS_MAP {uint next_address[];};

void main(void)
{
	// Perform forward (or inverse) prefix sum of tile head pointers
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
			sum += next_address[i-1];
		next_address[id] = sum;
	}
}