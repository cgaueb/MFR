#define inverse			1				
#define COUNTERS		32				
#define COUNTERS_2d		COUNTERS >> 1	

// for resolution : 1024 x 1024
#define COUNTERS_X		256				
#define COUNTERS_Y		192				
#define COUNTERS_W		4

int hashFunction(const ivec2 coords)
{
	ivec2  tile = ivec2(coords.x / COUNTERS_X, coords.y / COUNTERS_Y);
	return tile.x * COUNTERS_W + tile.y;
}