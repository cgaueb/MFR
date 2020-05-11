// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
// This file contains sorting algorithms for the A-buffer resolve step

// Sorting Algorithm			// Best		// Average		// Worst
#define SORT_SHELL			1	// n		// n(logn)^2	// n(logn)^2
#define SORT_INSERT			1	// n		// n^2			// n^2

// this is the number for automatically switching to shell sort for large layer sizes 
#define	INSERT_VS_SHELL			__INSERT_VS_SHELL__
// this is the maximum number of layers for each scene
#define ABUFFER_GLOBAL_SIZE		__ABUFFER_GLOBAL_SIZE__

// local arrays
uint  fragments_id	 [ABUFFER_GLOBAL_SIZE];
float fragments_depth[ABUFFER_GLOBAL_SIZE];

#if SORT_SHELL
void sort_shell(const int num)
{
	int inc = num >> 1;
	while (inc > 0)
	{
		for (int i = inc; i < num; ++i)
		{
			float tmp_depth = fragments_depth[i];
			uint tmp_id	= fragments_id[i];
			int j = i;
			while (j >= inc && fragments_depth[j - inc] < tmp_depth)
			{
				fragments_id[j] = fragments_id[j - inc];
				fragments_depth[j] = fragments_depth[j - inc];
				j -= inc;
			}
			fragments_depth[j] = tmp_depth;
			fragments_id[j]	   = tmp_id;
		}
		inc = int(inc / 2.2f + 0.5f);
	}
}
#endif

#if SORT_INSERT
void sort_insert(const int num)
{
	for (int j = 1; j < num; ++j)
	{
		float key_depth = fragments_depth[j];
		uint  key_id	= fragments_id[j];
		int i = j - 1;
		while (i >= 0 && fragments_depth[i] < key_depth)
		{
			fragments_depth[i+1] = fragments_depth[i];
			fragments_id[i+1]	 = fragments_id[i];
			--i;
		}
		fragments_id[i+1] = key_id;
		fragments_depth[i+1] = key_depth;
	}
}
#endif

void sort(const int num)
{
	if (num <= INSERT_VS_SHELL)
		sort_insert(num);
	else
		sort_shell(num);
}
