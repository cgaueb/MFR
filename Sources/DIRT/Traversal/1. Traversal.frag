// DIRT: Deferred Image-based Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
// This file contains the fragment implementation for the Traversal stage
// First, the shading buffer contents G[k] for the current pixel (gl_FragCoord.xy) are fetched
// Then, a new ray direction is generated (e.g. based on BSDF sampling) and is probability is also retrieved
// The new ray is traced:
// (i) hierarchically in screen space - empty regions are skipped via the depth texture
// (ii) in the depth intervals it intersects in depth space (for each pixel sample) - non intersected depth intervals (buckets) are skipped
// (iii) in the id buffer, for each intersected depth interval, by performing analytic intersection tests between the ray and the stored primitive in the id buffer
// If a hit occurs, a hit record is created in the hit buffer at the intersection location. This way, a rasterization pass can be initiated later on to fetch the shading attributes.
// The hit record also stores the current pixel (gl_FragCoord.xy), as the owner. This way, the interpolated data during the Fetch pass will be stored at the position the tracing started.
// Storing the shading information this way, allows for an easy illumination pass during the last pass, called the Shade pass.
// Finally, the probability is stored in the operators_probabilities texture to be used during the Shade pass for correct path tracing computations
// Note:
// - Since the id buffer can be downscaled, holding primitive data at a tile of size larger than 1x1 pixels (e.g. tile size:2x2 which is lod level 1). So, hierarchical traversal occurs as usual but stops at a higher lod level than 0 (e.g. at lod=1). This is the only practical difference during the Traversal stage.


#version 440 core
#include "data_structs.h"

#define BUCKET_SIZE				__BUCKET_SIZE__
#define BUCKET_SIZE_1n			BUCKET_SIZE - 1
#define NUM_CUBEMAPS 			__NUM_FACES__
#define MAX_FACE_LAYERS 		NUM_CUBEMAPS

// image bindings
layout(binding = 0, rgba32f)	coherent	uniform image2D			image_operators_probabilities;					// the transport operators texture
layout(binding = 1, r32ui )		coherent 	uniform uimage2D  		image_hit_buffer_head;							// the hit buffer head id texture
layout(binding = 2, std430)		coherent 	buffer  LLD_SHADING	 { NodeTypeShading		nodes_shading []; };    	// the shading buffer
layout(binding = 3, std430)		readonly 	buffer  LLD_ID 		 { NodeTypeTrace		nodes_id[]; };          	// the id buffer
layout(binding = 4, std430)		writeonly 	buffer  LLD_HIT		 { NodeTypePeel			nodes_hit[]; };         	// the hit buffer
layout(binding = 5, std430)		readonly 	buffer  LLD_VERTEX	 { NodeTypePrimitive 	nodes_vertex[]; };			// the vertex buffer
layout(binding = 6, offset = 0)		   uniform atomic_uint		  next_address;										// the next address counter for the hit buffer
layout(binding = 11) uniform sampler2DArray tex_depth_bounds;														// the depth bounds texture, used for HiZ
layout(binding = 12) uniform usampler2DArray tex_head_id_buffer;													// the id buffer head id texture

// set the incoming value as the head and the returned value as the next pointer
uint  exchangeHitBufferHead		(const ivec2 coords, const uint val	) { return imageAtomicExchange	(image_hit_buffer_head, coords, val); }

// gets the hit buffer head for the current pixel
uint  getPixelHeadHitBuffer	(const ivec2 coords, const int b) { return	imageLoad (image_hit_buffer_head	,coords, b)).x; }

// gets the id buffer head for the current pixel
uint  getPixelHeadidBuffer	(const ivec2 coords, const int b) { return	texelFetch(tex_head_id_buffer	, coords, b), 0).x; }

// store and load the texture holding the transport operators-probabilities used for path tracing
void storeOperatorsProbabilities	(const vec4 value)	{ imageStore (image_operators_probabilities, ivec2(gl_FragCoord.xy), value); }
vec4 loadOperatorsProbabilities		(				 )	{ return imageLoad (image_operators_probabilities, ivec2(gl_FragCoord.xy));}

uniform mat4 uniform_view[NUM_CUBEMAPS];											// world->eye transformation for all views 
uniform mat4 uniform_view_inverse[NUM_CUBEMAPS];                                    // eye->world transformation for all views 
uniform mat4 uniform_proj[NUM_CUBEMAPS];                                            // eye->projection transformation for all views 
uniform mat4 uniform_pixel_proj[NUM_CUBEMAPS];                                      // eye->pixel transformation for all views 
uniform vec2 uniform_near_far[NUM_CUBEMAPS];                                        // near far clipping distance for all views
uniform vec2 uniform_viewports[NUM_CUBEMAPS];                                       // object->eye transformation for all views 
uniform mat4 uniform_view_pixel_proj[NUM_CUBEMAPS];									// world->pixel transformation for all views 
uniform mat4 uniform_view_pixel_proj_high_res[NUM_CUBEMAPS];                        // world->pixel transformation for all views in the shading resolution (since the id buffer can be downscaled)
uniform float uniform_scene_length;                                                 // the diagonal size of the bounding box (used for clipping each ray against a view)
uniform int uniform_ab_mipmap;														// the minimum lod of the id buffer and the depth texture
uniform int uniform_depth_mipmap;													// the maximum lod of the depth texture (used during HiZ)

// global variables
vec3 ray_origin_wcs;                                                                // the ray origin
vec3 ray_dir_wcs;																	// the ray direction
vec3 out_hit_wcs;                                                                   // the intersection location which will be used to find the storage location of the hit record
vec2 out_hit_barycentric;                                                           // the intersection's barycentric coordinates which will be stored in the hit record
uint out_primitive_id;                                                              // the intersection's primitive id which will be stored in the hit record

// per pixel id buffer tracing
#include "analytic_ssrt.glsl"
// hiz multiview tracing
#include "pt_tracing_deferred.glsl"

void main(void)
{			
	// each 3-point pair is stored sequentially	
	uvec2 dimensions = uvec2(uniform_viewports[0]);
	uvec2 frag = uvec2(floor(gl_FragCoord.xy));
	
	uint resolve_index = uint(frag.y * dimensions.x + frag.x) * 3u;	
	bool isEmpty = 	nodes_shading[resolve_index + 2u].position.w < 0;
	// if there is no tracing to do
	if(isEmpty)
	{
		nodes_shading[resolve_index].position.w			= -1;
		nodes_shading[resolve_index + 1u].position.w	= -1;
		nodes_shading[resolve_index + 2u].position.w	= -1;
		storeOperators(vec4(-1));
		return;
	}
	
	// initiate variables
	// we store the inverse probability to avoid divisions in the Shade pass
	float current_vertex_to_next_inverse_probability = 1.0;
	vec3 current_vertex_sample_dir = vec3(0);
	out_hit_barycentric = vec2(0);
	out_hit_wcs = vec3(0);
	
	vec3 position = vec3(0);
	int face	  = 0;
	// retrieve data from the shading buffer at location G[k]
	//
	// vec3 position = nodes_shading[resolve_index + 1u].position.xyz;
	// int face		 = int(nodes_shading[resolve_index + 1u].position.w);
	// vec3 normal   = ...;
	//
	// generate a ray based, for example using BSDF sampling and retrieve its probability
	// ...
	
	// trace the id buffer in multiple views
	bool has_hit = traceScreenSpaceRay_abuffer(position, current_vertex_sample_dir, face);

	// store the cumulative probabilities for the Shade pass
	vec4 image_operators_probabilities = loadOperators();
	storeOperators(vec4(image_operators_probabilities.rgb, image_operators_probabilities.w * current_vertex_to_next_inverse_probability));
}
