// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
// This file contains example data structures for the various A-buffer implementations
// The Data attributes shown here (albedo, normal, etc.) are simply informative

// Non-Decoupled Versions
struct NodeTypeDataLL
{
	float	depth;
	uint	next;

	uint	albedo;
	uint	normal;
	uint	specular;
	uint	ior_opacity;
};

struct NodeTypeDataLL_Double
{
	float	depth;

	uint	albedo;
	uint	normal;
	uint	specular;
	uint	ior_opacity;

	uint	next;
	uint	prev;
};

struct NodeTypeDataSB
{
	float	depth;

	uint	albedo;
	uint	normal;
	uint	specular;
	uint	ior_opacity;
};

// Decoupled Versions
// NodeTypeData (Attributes)
struct NodeTypeData
{
	uint	albedo;
	uint	normal;
	uint	specular;
	uint	ior_opacity;
};

// ID Buffers
struct NodeTypeSB
{
	float	depth;
	uint	index;
};

struct NodeTypeLL
{
	float	depth;
	uint	next;
};

struct NodeTypeLL_Double
{
	float	depth;

	uint next;
	uint prev;
};