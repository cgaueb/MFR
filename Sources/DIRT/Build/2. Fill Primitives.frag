// DIRT: Deferred Image-based Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
// This file contains the fragment implementation for the Fill Primitives pass
// Incoming primitives are clipped against against pixel the frustum boundaries
// and stored in all buckets overlapping the clipped primitive
// Note: This pass requires conservative rasterization, otherwise i) the minimum lod level must be 0 and (ii) oblique primitives might not be rasterized

#version 440 core

#include "data_structs.h"
#include "clip.glsl"

#define NUM_CUBEMAPS			__NUM_FACES__
#define BUCKET_SIZE				__BUCKET_SIZE__
#define BUCKET_SIZE_1n			BUCKET_SIZE - 1

flat in int cube_index;											// the view index from the geometry shader
flat in vec4 prim_vertex_wcs[3]; 								// the incoming vertex positions from the geometry shader

uniform mat4	uniform_view_array[NUM_CUBEMAPS]; 				// world->eye transformation for all views
uniform vec2	uniform_near_far[NUM_CUBEMAPS]; 				// near far clipping distance for all views
uniform vec4	uniform_viewports[NUM_CUBEMAPS]; 				// viewport for all views
uniform vec3	uniform_plane_points_wcs[NUM_CUBEMAPS * 8]; 	// world space position of the frustum corners for all views

uniform int uniform_ab_mipmap;									// the lod level of the downscaled id buffer e.g. for a tile of 1x1 uniform_ab_mipmap = 0, for a tile of 2x2 uniform_ab_mipmap = 1, etc.

layout(binding = 0, r32ui  ) 	coherent uniform uimage2DArray	  image_head_id_buffer;			// the storage location for the head textures (1 head pointer is used for each bucket)
layout(binding = 1, std430)		coherent buffer  LLD_ID	 { NodeTypeIDBuffer		nodes_id[]; };	// the id buffer
layout(binding = 2, offset = 0)	uniform atomic_uint		  next_address;							// the next address counter for the id buffer
layout(binding = 3) 			uniform sampler2DArray tex_depth_bounds;    					// the depth bounds texture

// set the incoming value as the head and the returned value as the next pointer
uint exchangeidBufferHead(const int  b, const uint val)	{return imageAtomicExchange	(image_head_id_buffer, ivec3(gl_FragCoord.xy, b), val);}

void main(void)
{	
	// clip the primitive against the frustum boundaries
	vec3 p1 = prim_vertex_wcs[0].xyz;
	vec3 p2 = prim_vertex_wcs[1].xyz;
	vec3 p3 = prim_vertex_wcs[2].xyz;
	vec2 bounds = clip(p1, p2, p3);
	float	minZ		= bounds.x;
	float	maxZ		= bounds.y;

	// find the bucket range overlapping the clipped primitive
	ivec2	coords_lod = ivec2(gl_FragCoord.xy);
	vec2	depths		= texelFetch(tex_depth_bounds, ivec3(coords_lod, cube_index), uniform_ab_mipmap).rg;
	float	depth_near	= -depths.r;
	float	depth_far	=  depths.g;
	float	depth_length = depth_far - depth_near;
	int		b0			 = min(int((float(BUCKET_SIZE)*((minZ - depth_near)/depth_length))),BUCKET_SIZE_1n); 
	int		b1			 = min(int((float(BUCKET_SIZE)*((maxZ - depth_near)/depth_length))),BUCKET_SIZE_1n);

	// store the clipped primitive in all buckets overlapping it
	int _b = b0;
	for(int b=0; b<=BUCKET_SIZE_1n && _b <= b1; b++)
	{
		uint index = atomicCounterIncrement(next_address) + 1U;
		if (index >= nodes_id.length()) return;

		int bucket						= uniform_cube_index * BUCKET_SIZE + _b;	
		nodes_id[index].next			= exchangeidBufferHead(bucket, index);
		nodes_id[index].primitive_id	= primitive_id;
		_b++;
	}
}