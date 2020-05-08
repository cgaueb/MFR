// DIRT: Deferred Image-based Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
// This file contains example geometry implementation for the Fill Primitives pass
// It servers as a demonstration of how a separate vertex buffer can be used
// Note: to avoid missing geometry entirely parallel to the view, the primitives can be slightly shifted (not demonstrated here)

#version 440 core
#define NUM_CUBEMAPS __NUM_FACES__
#include "data_structs.h"

layout(triangles) in;
layout (triangle_strip, max_vertices=NUM_CUBEMAPS*3) out;

in vec2 vTexCoord[3];
in vec3 vposition[3];
in vec3 vnormal[3];
in vec3 vtangent[3];

flat out int cube_index;											// the view index from the geometry shader
flat out vec4 prim_vertex_wcs[3]; 									// the incoming vertex positions from the geometry shader		
uniform mat4 uniform_m;												// object->world transformation for the incoming vertices
uniform mat4 uniform_mv[NUM_CUBEMAPS];								// object->eye transformation for all views
uniform mat4 uniform_mvp[NUM_CUBEMAPS];								// object->projection transformation for all views
uniform uint uniform_current_total_primitives;						// the total primitives	so far, if multiple draw calls have been initiated

layout(binding = 4, std430)	 coherent buffer  LLD_PRIMITIVE	 { NodeTypeVertexBuffer nodes_vertex[]; }; // the vertex buffer

void main()
{
	// transform incoming positions to world space
	// and send them for clipping to the fragment shader
	prim_vertex_wcs[0] = uniform_m * vec4(vposition[0], 1);
	prim_vertex_wcs[1] = uniform_m * vec4(vposition[1], 1);
	prim_vertex_wcs[2] = uniform_m * vec4(vposition[2], 1);
	
	// the current primitive id
	primitive_id = uniform_current_total_primitives + uint(gl_PrimitiveIDIn);
		
	// store vertex buffer data
	nodes_vertex[primitive_id].position1_normal1x = vec4(prim_vertex_wcs[0].xyz, vnormal[0].x);
	nodes_vertex[primitive_id].position2_normal1y = vec4(prim_vertex_wcs[1].xyz, vnormal[0].y);
	nodes_vertex[primitive_id].position3_normal1z = vec4(prim_vertex_wcs[2].xyz, vnormal[0].z);
	nodes_vertex[primitive_id].normal2_tangent1x = vec4(vnormal[1].xyz,   vtangent[0].x);
	nodes_vertex[primitive_id].normal3_tangent1y = vec4(vnormal[2].xyz,   vtangent[0].y);
	nodes_vertex[primitive_id].tangent2_tangent1z = vec4(vtangent[1].xyz, vtangent[0].z);
	nodes_vertex[primitive_id].tangent3 = vec4(vtangent[2].xyz, 0.0);
	nodes_vertex[primitive_id].texcoord1_texcoord2 = vec4(vTexCoord[0].xy, vTexCoord[1].xy);
	nodes_vertex[primitive_id].texcoord3 = vec4(vTexCoord[2].xy, 0.0, 0.0);	
	nodes_vertex[primitive_id].vertex_color1 = vec4(vvertex_color[0]);
	nodes_vertex[primitive_id].vertex_color2 = vec4(vvertex_color[1]);
	nodes_vertex[primitive_id].vertex_color3 = vec4(vvertex_color[2]);

	// emit primitives to each view
	for (int i = 0; i < NUM_CUBEMAPS; ++i)
	{
		// change the viewport (could be different for each view)
		gl_ViewportIndex = i;
		// set the view index
		cube_index = i;
		for(int j = 0; j < gl_in.length(); j++)
		{	
			// copy attributes
			gl_Position = uniform_mvp[i] * vec4(vposition[j], 1);
	
			// done with the vertex
			EmitVertex();
		}
		// done with the primitive
		EndPrimitive();
	}
}
