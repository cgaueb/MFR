// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou
// This file contains the vertex construction and a-buffer tracing of a unique pixel

#define BUCKET_SIZE		__BUCKET_SIZE__
#define BUCKET_SIZE_1n	BUCKET_SIZE - 1

// image bindings
// stored head pointers sequentially for each view and each buckets and then the tail pointers in the same manner
layout(binding = 3, r32ui )	readonly uniform uimage2DArray  image_head_tail;
// the ID buffer
layout(binding = 4, std430)	readonly buffer  LL_DATA	 { NodeTypeData			data []; };
// the Data buffer
layout(binding = 5, std430)	readonly buffer  LLD_NODES	 { NodeTypeLL_Double	nodes[]; };
// the depth bounds
layout(binding = 11) uniform sampler2DArray tex_depth_bounds;
	
// retrieve the head ID for a bucket
uint  getPixelHeadID	(const ivec3 coords)	{ return imageLoad (image_head_tail, ivec3(coords)).r;}
// retrieve the tail ID for a bucket
uint  getPixelTailID	(const ivec3 coords)	{ return imageLoad (image_head_tail, ivec3(coords.xy, coords.z + BUCKET_SIZE*MAX_FACE_LAYERS)).r;}

// retrieve the dimensions for the abuffer
vec3 getVertexPosition(vec3 vertex_coords, int index)
{
	uint id							= uint(vertex_coords.z);
	NodeTypeLL_Double node_id		= nodes[id];
	float pndcZ						= projectZ(node_id.depth, index);
	vec2 texcoord					= vec2(vertex_coords.xy) / uniform_viewports[index];
	return reconstruct_position_from_depth(texcoord.xy, pndcZ, index);
}

// create a new vertex
// vertex_coords: xy the pixel coordinates, z the linked-list id
// index: the view index
Vertex createVertex(vec3 vertex_coords, int index)
{
	Vertex vertex;
	
	// retrieve vertex eye space position
	uint id							= uint(vertex_coords.z);
	NodeTypeLL_Double node_id		= nodes[id];
	float pndcZ						= projectZ(node_id.depth, index);
	vec2 texcoord					= vec2(vertex_coords.xy) / uniform_viewports[index];
	vertex.position					= reconstruct_position_from_depth(texcoord.xy, pndcZ, index);
	// store the view index
	vertex.face						= index;

	// retrieve any required shading parameters
	NodeTypeData node				= data[id];
	
	/* example code
	vertex.color 					= unpackUnorm4x8(node.albedo);
	vertex.normal 					= unpackUnorm2x16(node.normal);
	vertex.specular					= unpackUnorm4x8(node.specular);
	.
	.
	.
	*/;
	
	// keep position and normal in the main view's eye space values for easier lighting calculations
	if (index > 0)
	{
		vertex.position				= vec3(uniform_view[0] * uniform_view_inverse[vertex.face] * vec4(vertex.position, 1)).xyz;
		vertex.normal				= vec3(uniform_view[0] * uniform_view_inverse[vertex.face] * vec4(vertex.normal, 0)).xyz;
	}	

	return vertex;
}

// check if the current ABuffer is empty
// in this case, all buckets must be empty
bool isABufferEmpty(ivec2 coords)
{
	for(int b = 0; b < BUCKET_SIZE; ++b)
	{
		if (getPixelHeadID(ivec3(coords, b)) > 0U)
			return false;
	}
	return true;
}

// trace function
// binary search is not available in linked lists
int ray_hit_a_buffer_search(ivec2 coords, float minZ, float maxZ, vec2 thickness, int increment, int cubemapindex)
{
	// maxZ out of bounds
	if (maxZ >= 0.0) return invalid_result;

	int cube_offset = cubemapindex * BUCKET_SIZE;
	int depth_offset = cubemapindex * 2;

	float maxZ_thickness = maxZ + thickness.x * 1;
	float minZ_thickness = minZ;// - thickness.y * 0.5;

	// pixel early skip out of Z-slice bounds
	vec2  depths		= texelFetch(tex_depth_bounds, ivec3(coords, cubemapindex), 0).rg;
	float depth_near	= -depths.r;

	if (minZ >= -depth_near) return invalid_result;
		
	float depth_far	= depths.g;	
	if (maxZ_thickness <= -depth_far) return invalid_result;

	// bucket early skip out of Z-slice bounds
	float	depth_length = depth_near - depth_far;
	int		b0			 = (		   maxZ_thickness >= -depth_near) ? 0 : min(int((float(BUCKET_SIZE)*((depth_near + maxZ)/depth_length))),BUCKET_SIZE_1n); 
	int		b1			 = (b0 == 3 || minZ <= -depth_far ) ? 3 : min(int((float(BUCKET_SIZE)*((depth_near + minZ)/depth_length))),BUCKET_SIZE_1n);
	int		d = max(0, b1 - b0);
	b0 = cube_offset + b0;
	b1 = cube_offset + b1;

	// increment is positive if the ray is moving in the direction of the camera, 
	// negative towards the camera (which must flip the search order)
	const bool	reverseZ = increment < 0;
	const int	inc		 = (reverseZ) ? -1 : 1;
			int	b		 = (reverseZ) ? b1 : b0;
			
	uvec2 init_index;
	float sceneZ;
	float normalZ;
	int	 index_max	= invalid_result;
	int num_layers = 1;
	
	// traverse through the double linked list, based on the ray direction
	// and retrieve the appropriate fragment in each case	
	for(int i=0; i <= d && index_max == -1; i++, b += inc)
	{
		init_index[0] = getPixelHeadID(ivec3(coords, b));
		if(init_index[0] <= 0U)	continue;

		init_index[1] = (reverseZ) ? getPixelTailID(ivec3(coords, b)) : 0U;

		uint index;

		if(reverseZ)
		{
			index = init_index.y;
			while(index != 0U && index_max < 0)
			{
				sceneZ  = nodes[index].depth;
				NodeTypeLL_Double node = nodes[index];
				if (node.depth <= maxZ_thickness && node.depth > minZ)
					index_max = int(index);
				index	= node.prev;
			}
		}
		else
		{
			index = init_index.x;
			while(index != 0U && index_max < 0)
			{
				NodeTypeLL_Double node = nodes[index];
				if (node.depth <= maxZ_thickness && node.depth > minZ)
					index_max = int(index);
				index	= node.next;
			}
		}
	}

	return index_max;
}