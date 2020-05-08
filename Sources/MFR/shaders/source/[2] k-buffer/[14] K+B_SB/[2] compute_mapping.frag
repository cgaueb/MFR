#include "define.h"
#include "s-buffer.h"

		 uniform uint *next_address [COUNTERS];
coherent uniform uint *final_address[COUNTERS];

	void setSharedFinalAddress	(int j, uint val) {(*final_address[j]) = val;}

	void main(void)
	{
		int id = int(gl_FragCoord.y);
		if(id < COUNTERS)
		{
			int  k	 = 0;
			uint sum = 0U;
			for(int i = id; i > k; i--)
				sum += (*next_address[i-1]);
			setSharedFinalAddress(id, sum);
		}
	}