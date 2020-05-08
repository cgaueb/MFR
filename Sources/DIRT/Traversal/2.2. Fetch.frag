// DIRT: Deferred Image-based Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
// This file contains the fragment implementation for the Fetch pass
// For each rasterized primitive, the hit buffer is iterated and checked for equality.
// On each successful comparison, the hit record is fetched where (i) the barycentric coordinates are used to interpolate the shading information
// and (ii) the interpolated information is stored at G[k+2] location of the shading buffer. This location is stored in the hit record as well (the variable's name is owner).
// It is practically the pixel location on which the tracing started.

#version 440 core

#include "data_structs.h"

layout (early_fragment_tests) in;								// the bound depth mask is used here a pixel rejection mechanism

flat in int cube_index;											// the view index from the geometry shader
flat in uint primitive_id;                                      // the incoming primitive id from the geometry shader
uniform mat4 uniform_mv[NUM_CUBEMAPS];							// object->eye transformation for all views

// image bindings
layout(binding = 0, r32ui )		coherent uniform uimage2D		   image_hit_buffer_head;								// the hit buffer head id texture
layout(binding = 1, std430)		coherent buffer  LLD_SHADING	 { NodeTypeShadingBuffer		nodes_shading []; };	// the shading buffer
layout(binding = 2, std430)		coherent buffer  LLD_HIT		 { NodeTypeHitBuffer			nodes_hit[]; };			// the hit buffer
layout(binding = 3, std430)		coherent buffer  LLD_VERTEX		 { NodeTypeVertexBuffer			nodes_vertex[]; };		// the vertex buffer

// gets the hit buffer head for the current pixel
uint  getHitBufferHeadID(const ivec2 coords)					 { return imageLoad (image_hit_buffer_head).x; }

void main(void)
{	
	// get the head of the id buffer
	// when the mask texture is employed, this shound never be null (0u)
	uint index = getHitBufferHeadID(ivec2(gl_FragCoord.xy));
	while(index > 0u)
	{		
		if (nodes_hit[index].primitive_id == primitive_id)
		{
			// aqcuire the barycentric coordinates
			vec3 barycentric = vec3(nodes_hit[index].barycentric_view.xy,0.0);
			barycentric.z = 1.0 - barycentric.x - barycentric.y;
			
			// retrieve the primitive information from the vertex buffer (in object space)
			NodeTypeVertexBuffer prim = nodes_vertex[primitive_id];
			vec3 vposition[0] 	= vec3(m_inv * vec4(prim.position1_normal1x.xyz, 1.0)).xyz;
			vec3 vposition[1] 	= vec3(m_inv * vec4(prim.position2_normal1y.xyz, 1.0)).xyz;
			vec3 vposition[2] 	= vec3(m_inv * vec4(prim.position3_normal1z.xyz, 1.0)).xyz;
			vec3 vnormal[0] 	= vec3(prim.position1_normal1x.w, prim.position2_normal1y.w, prim.position3_normal1z.w);
			vec3 vnormal[1] 	= prim.normal2_tangent1x.xyz;
			vec3 vnormal[2] 	= prim.normal3_tangent1y.xyz;
			vec3 vtangent[0] 	= vec3(prim.normal2_tangent1x.w, prim.normal3_tangent1y.w, prim.tangent2_tangent1z.w);
			vec3 vtangent[1] 	= prim.tangent2_tangent1z.xyz;
			vec3 vtangent[2] 	= prim.tangent3.xyz;
			vec2 vTexCoord[0] 	= prim.texcoord1_texcoord2.xy;
			vec2 vTexCoord[1] 	= prim.texcoord1_texcoord2.zw;
			vec2 vTexCoord[2] 	= prim.texcoord3.xy;
			
			// get the interpolated values
			position_ecs	= vposition[0]*		barycentric.z + vposition[1]*		barycentric.x + vposition[2]*		barycentric.y;
			texuv			= vTexCoord[0]*		barycentric.z + vTexCoord[1]*		barycentric.x + vTexCoord[2]*		barycentric.y;
			normal_ecs		= vnormal[0]*		barycentric.z + vnormal[1]*			barycentric.x + vnormal[2]*			barycentric.y;
			tangent_ecs		= vtangent[0]*		barycentric.z + vtangent[1]*		barycentric.x + vtangent[2]*		barycentric.y;

			// convert any required values to eye space
			view			= int(prim_id_cube.y);
			position_ecs	= vec3(uniform_mv[view] * vec4(position_ecs,1)).xyz;
			normal_ecs		= normalize ((uniform_mv[view] * vec4(normal_ecs,0)).xyz);
			tangent_ecs		= normalize ((uniform_mv[view] * vec4(tangent_ecs,0)).xyz);
			bitangent_ecs	= cross(normal_ecs,tangent_ecs);

			// perform texture fetches
			// ...
			
			// store these values in the second position of shading data buffer
			ivec2 owner			= ivec2(nodes_hit[index].owner);
			uvec2 dimensions 	= uvec2(imageSize(image_hit_buffer_head).xy);
			uint  resolve_index = uint(owner.y * dimensions.x + owner.x) * 3u + 2u;
		
			nodes_shading[resolve_index].position.xyz = pecs;
			// the last channel stores the cube index
			nodes_shading[resolve_index].position.w = nodes_hit[index].barycentric_view.z;
			
			// example values!!!
			nodes_shading[resolve_index].albedo	  = packUnorm4x8(vec4(1,0,0,0));
			nodes_shading[resolve_index].normal	  = packUnorm4x8(vec4(1,0,0,0));
			nodes_shading[resolve_index].specular = packUnorm4x8(vec4(1,0,0,0));	
		}
		index	= nodes_hit[index].next;
	}
}