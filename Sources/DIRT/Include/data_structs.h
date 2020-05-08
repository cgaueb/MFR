// DIRT: Deferred Image-based Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
// This file contains the data structs used for each storage unit
// Note: The vertex buffer provided as an example. It can be used as is or replaced with the vertex buffer available in OpengGL

// Vertex Buffer
// 9 * 4 * sizeof(float) = 144 bytes
// Stores the vertex data for each primitive
struct NodeTypeVertexBuffer
{
	vec4 position1_normal1x;
	vec4 position2_normal1y;
	vec4 position3_normal1z;
	vec4 normal2_tangent1x;
	vec4 normal3_tangent1y;
	vec4 tangent2_tangent1z;
	vec4 tangent3;
	vec4 texcoord1_texcoord2;
	vec4 texcoord3;
};

// ID Buffer
// 2 * sizeof(uint) = 8 bytes
// Stores the traversal data for the entire scene
struct NodeTypeIDBuffer
{
	// pointer to the next primitive in the list
	uint	next;
	// the primitive id
	uint	primitive_id;
};

// Hit Buffer
// 2 * sizeof(uint) + 6 * sizeof(float) = 32 bytes
// Contains hit intersection information at the pixel location where the intersection occured
struct NodeTypeHitBuffer
{
	// pointer to the next hit record in the list
	uint	next;
	// the primitive id at which the intersection occured
	uint	primitive_id;
	// the shading buffer location where the traversal started (the pixel ray origin)
	vec2	owner;
	// contains packed hit record information such as the barycentric coordinates of the primitive
	vec4	barycentric_view;
};

// Shading buffer
// PACKED: 3 * sizeof(uint) + 1 * sizeof(float) = 32 bytes
// Example contents
struct NodeTypeShadingBuffer
{
	uint	albedo;
	uint	normal;
	uint	specular;
	vec4	position;
};