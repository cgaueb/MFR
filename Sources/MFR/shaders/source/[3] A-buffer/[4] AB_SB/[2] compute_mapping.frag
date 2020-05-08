#include "define.h"
#include "s-buffer.h"

		 uniform  int  width;
		 uniform uint *next_address [COUNTERS];
coherent uniform uint *final_address[COUNTERS];

void setSharedFinalAddress (int j, uint val) {(*final_address[j]) = val;}

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
			sum += (*next_address[i-1]);
		setSharedFinalAddress(id, sum);
	}
}