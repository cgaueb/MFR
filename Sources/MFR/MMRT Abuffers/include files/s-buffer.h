// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou

// [VF12] Andreas A. Vasilakis and Ioannis Fudos, S-buffer: Sparsity-aware Multi-fragment Rendering , In Proceedings of Eurographics 2012, Short Papers, pp. 101-104, Cagliari, Italy, May 13-18, 2012.
// [VPF15] Andreas A. Vasilakis, Georgios Papaioannou and Ioannis Fudos, k+-buffer: An Efficient, Memory-friendly and Dynamic k-buffer Framework , IEEE Transactions on Visualization and Computer Graphics, vol.21, no. 6, pp. 688-700, June 2015.

#define inverse			0				
#define COUNTERS		32				
#define COUNTERS_2d		COUNTERS >> 1	

// for resolution : 1024 x 1024
#define COUNTERS_X		256				
#define COUNTERS_Y		192				
#define COUNTERS_W		4				

int hashFunction(ivec2 coords)
{
	// Old Hash Function from [VF12]	
	//return (coords.x + 1024*coords.y) % COUNTERS;

	// New Hash Function from [VPF15]	
	ivec2 tile = ivec2(coords.x / COUNTERS_X, coords.y / COUNTERS_Y);
	return tile.x * COUNTERS_W + tile.y;
}
