// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou
// 
// This file contains a basic Path Tracing implementation
// which performs ray tracing in pixel increments through the multiview structure
// Two external files are required (and included later on):
// 
// File 1: "pt_abuffer_cubemap.glsl"
// This file contains the vertex construction and a-buffer tracing of a unique pixel
// for a specific abuffer implementation
// File 2: "pt_tracing.glsl"
// This file contains the implementation for tracing through multiple views.
//
// Note that the actual lighting functions (BSDF calculations and sampling) used here are commented 
// out and not included. The reason for this is that they are based on our custom lighting system which
// would probably complicate rather than simplify the whole operation. 
// However, if you require them, send an e-mail at kvardis@hotmail.com.

#version 430 core
in vec2 TexCoord;

layout(binding = 0, rgba32f)	coherent	uniform image2D			image_result;

// main defines
// Uniform fragment thickness
#define THICKNESS __THICKNESS__

// Number of path tracing bounces (0: direct, 1: 1-indirect, etc.)
#define BOUNCES __BOUNCES__

// Samples per ray. CONSERVATIVE_MARCHING denotes linear marching with no jumps between pixels
// if MAX_SAMPLES_PER_RAY is defined as -1 then CONSERVATIVE_MARCHING is defined instead of a number 
#define MAX_SAMPLES_PER_RAY __MAX_SAMPLES_PER_RAY__
#if MAX_SAMPLES_PER_RAY < 1
	#define CONSERVATIVE_MARCHING
#endif

// The number of views
#define NUM_CUBEMAPS __NUM_VIEWS__
#define MAX_FACE_LAYERS NUM_CUBEMAPS

// This is used to denote the the ray should stop when reaching the ends of the scene's extents
// In other cases, such as Ambient Occlusion, a fixed value can be used instead
#define UNLIMITED_RAY_DISTANCE

#define invalid_result -1

uniform vec3 uniform_background_color;
uniform mat4 uniform_view[NUM_CUBEMAPS];
uniform mat4 uniform_view_inverse[NUM_CUBEMAPS];
uniform mat4 uniform_proj[NUM_CUBEMAPS];
uniform mat4 uniform_proj_inverse[NUM_CUBEMAPS];
uniform mat4 uniform_pixel_proj[NUM_CUBEMAPS];
uniform float uniform_scene_length;
uniform vec2 uniform_near_far[NUM_CUBEMAPS];
uniform vec2 uniform_near_far_comb[NUM_CUBEMAPS];
uniform vec2 uniform_viewports[NUM_CUBEMAPS];
uniform ivec4 uniform_viewport_edges[NUM_CUBEMAPS];
uniform float uniform_progressive_sample;
uniform float uniform_time;
uniform int uniform_blend;

// this struct holds the shading attributes required for each vertex
struct Vertex
{	
	vec3 position;
	// which face this vertex belongs to
	int face;	
	/* example parameters	
	vec4 color;				
	vec3 normal;
	float metallicity;
	vec3 ior;
	float reflectivity;
	float roughness;		
	float opacity;
	bool transmission;
	float optical_thickness;
	*/
};

//------------------------------------------------------------ COORDINATE SYSTEMS START

// conversion between different coordinate systems

// reconstruct the eye space position for a specific view (index)
vec3 reconstruct_position_from_depth(vec2 texcoord, float depth, int index)
{
	vec4 pndc = vec4(2 * vec3(texcoord.xy, depth) - 1, 1);
	vec4 pecs = uniform_proj_inverse[index] * pndc;
	pecs.xyz = pecs.xyz/pecs.w;
	return pecs.xyz;
}

// project an eye space Z value and retrieve its equivalent NDC value (0->1] for a specific view (index)
// the uniform_near_far_comb parameter contains the values:
// uniform_near_far_comb.x = near * far;
// uniform_near_far_comb.y = -near  + far;
float projectZ(float pecsZ, int index)
{
	float tmpZ = -pecsZ * (uniform_near_far[index].x + uniform_near_far[index].y) - (2 * uniform_near_far_comb[index].x);
	tmpZ /= -pecsZ * uniform_near_far_comb[index].y;
	return tmpZ * 0.5 + 0.5;
}

//------------------------------------------------------------ COORDINATE SYSTEMS END

const float pi = 3.1415936;

//------------------------------------------------------------ RANDOM_NUMBER_GENERATION
// implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
float rand1_sin(vec2 seed)
{
    highp vec3 abc = vec3(12.9898, 78.233, 43758.5453);
    highp float dt= dot(seed.xy, vec2(abc.x,abc.y));
    highp float sn= mod(dt, 2*pi);
    return max(0.01, fract(sin(sn) * abc.z));
}

float rand1_cos(vec2 seed)
{
    highp vec3 abc = vec3(4.898, 7.233, 23421.631);
    highp float dt= dot(seed.xy, vec2(abc.x,abc.y));
    highp float sn= mod(dt, 2*pi);
    return max(0.01, fract(cos(sn) * abc.z));
}

vec2 rand2n(vec2 seed) {
    return vec2(rand1_sin(seed), rand1_cos(seed)); 
};

vec3 rand3n(vec2 seed) {
	return vec3(rand1_sin(seed),
					rand1_cos(seed),
					rand1_sin(seed.yx));
}

vec2 getSamplingSeed(float iteration)
{
	return TexCoord.xy * 17 * (uniform_progressive_sample + fract(uniform_time)) * (iteration + fract(uniform_time));
}

vec2 getRotationSeed(vec3 position_ecs, float iteration)
{
	return position_ecs.xy * 29 + position_ecs.zx * 43 + TexCoord.xy * 17 * (uniform_progressive_sample + fract(uniform_time)) * (iteration + fract(uniform_time));
}

//------------------------------------------------------------ RANDOM_NUMBER_GENERATION END

// Tracing structure
// contains the fragment's eye space Z value and its previous and next pointers within the list
struct NodeTypeLL_Double
{
	float depth;
	uint  next;
	uint  prev;
};

// NodeTypeData (Attributes)
struct NodeTypeData
{
	/* example data parameters
	uint	albedo;
	uint	normal;
	uint	specular;
	uint	ior_opacity;
	*/
};

// this file contains the vertex construction and a-buffer tracing of a unique pixel
// for a specific abuffer implementation
#include "pt_abuffer_cubemap.glsl"

// this file contains the DDA implementation for multiple views
#include "pt_tracing.glsl"

// store the final value for a certain path
// the alpha channel stores the total number of samples
// to properly weight each path's contribution
void store_color(vec3 final_color)
{

	vec4 stored_color = vec4(0.0);
	float total_samples = 1;

	// if this value is 1, samples are progressively accumulated on separate passes
	if (uniform_blend == 1)
	{
    	stored_color = imageLoad(image_result, ivec2(gl_FragCoord.xy));
		total_samples += stored_color.a;
	}
	final_color.xyz = final_color.xyz + stored_color.xyz * stored_color.a;
	final_color.xyz /= (total_samples);
	
	imageStore(image_result, ivec2(gl_FragCoord.xy), vec4(final_color.xyz, total_samples));
}

// main function
// basic path tracing implementation using the 3-point formulation of the light transport integral
// by iteratively tracing a new vertex and connecting the previous-current-next vertices until a path has been completed
void main(void)
{
	// check if the abuffer is empty
	vec3 current_vertex_coords = vec3(gl_FragCoord.xy, 0);
	bool isEmpty = isABufferEmpty(ivec2(current_vertex_coords.xy));
	if(isEmpty)
	{
		imageStore(image_result, ivec2(gl_FragCoord.xy), vec4(uniform_background_color.rgb, 1.0));
		return;
	}
	
	// initialize default values
	vec4 final_color = vec4(0,0,0,1);
	int	 layer = 0;	
	int result = ABUFFER_FACE_NO_HIT_EXIT;
	bool has_hit = false;
	vec3 point_transport_operators	= vec3(1.0);
	float point_transport_inverse_probabilities = 1.0;
	
	// the z value stores the index in the linked-list for a certain pixel
	current_vertex_coords.z = getPixelHeadID(ivec3(gl_FragCoord.xy, 0));

	// the current position
	Vertex current_vertex						= createVertex(current_vertex_coords, 0);

	// The camera
	vec3 prev_vertex_position_ecs = vec3(0);
	
	// the new vertex
	Vertex new_vertex;	
	
	// lighting parameters
	vec3 light_color_intensity = uniform_light_color;
	vec3 light_position_ecs = uniform_light_position;
	vec3 light_dir_ecs = uniform_light_direction;

	// calculate direct lighting
	// connect current vertex to light
	vec3 current_vertex_to_light_direction_ecs	= light_position_ecs - current_vertex.position;
	float current_vertex_to_light_dist2			= dot(current_vertex_to_light_direction_ecs, current_vertex_to_light_direction_ecs);
	current_vertex_to_light_direction_ecs		= normalize(current_vertex_to_light_direction_ecs);
	
	// check if the vertex is in shadow (e.g. via shadow mapping)
	float in_shadow = 1.0; //shadow(current_vertex.position);
	// if we didnt hit an object, we hit the light source
	if (in_shadow > 0.0)
	{
		vec3 current_vertex_to_prev_direction_ecs	= prev_vertex_position_ecs - current_vertex.position;
		current_vertex_to_prev_direction_ecs		= normalize(current_vertex_to_prev_direction_ecs);

		// retrieve the BSDF and the geometric term for the current vertex->light
		vec3 current_vertex_to_light_brdf			= vec3(1);  // getBSDF(current_vertex_to_light_direction_ecs.xyz, current_vertex_to_prev_direction_ecs.xyz, current_vertex);
		float current_vertex_to_light_geom			= 1.0 		// getGeometricTermPointLightSource(current_vertex_to_light_direction_ecs, current_vertex);
		vec3 current_vertex_to_light_transport_operator = current_vertex_to_light_brdf * current_vertex_to_light_geom * in_shadow;
			
		final_color.xyz								= current_vertex_to_light_transport_operator * light_color_intensity / current_vertex_to_light_dist2;
	}		
	// add any emission
	// final_color.xyz	+= emission;
	
	// calculate indirect lighting
	vec4 probabilities;
	int bounce = 1;
	vec3 current_vertex_sample_dir = vec3(0);
	for (bounce = 1; bounce <= BOUNCES; bounce++)
	{
		// trace to find a new vertex
		float current_vertex_to_next_inverse_probability = 1.0;

		// generate a new sampling direction based on the fragments's BSDF properties and retrieve the probability as well
		current_vertex_sample_dir = vec3(1); //getNewSamplePosition(current_vertex_to_next_inverse_probability, prev_vertex_position_ecs, current_vertex, bounce, transmission);
		
		// get a random number between 0.5->1 for offseting the start pixel
		vec2 seed = getRotationSeed(current_vertex.position, bounce);
		float random_rotation = rand1_sin(seed); 
		float jitter = random_rotation * 0.5 + 0.5;

		// trace the scene and find a new vertex position
		// if there is a hit, the returned vertex is created
		has_hit = traceScreenSpaceRay_abuffer(current_vertex.position, current_vertex_sample_dir, jitter, current_vertex.face, result, new_vertex);
				
		if (!has_hit) break;

		// connect current vertex to new vertex and get transport operator
		vec3 current_vertex_to_next_direction_ecs	= new_vertex.position - current_vertex.position;
		vec3 current_vertex_to_prev_direction_ecs	= prev_vertex_position_ecs - current_vertex.position;
		float current_vertex_to_next_dist2			= dot(current_vertex_to_next_direction_ecs, current_vertex_to_next_direction_ecs);
		current_vertex_to_next_direction_ecs		= normalize(current_vertex_to_next_direction_ecs);
		current_vertex_to_prev_direction_ecs		= normalize(current_vertex_to_prev_direction_ecs);
		
		// retrieve the BSDF and the geometric term for the current->next vertex
		vec3 current_vertex_brdf					= vec3(1);  // getBSDF(current_vertex_to_next_direction_ecs.xyz, current_vertex_to_prev_direction_ecs.xyz, current_vertex);
		float current_vertex_geom					= 1.0 		// getGeometricTerm(current_vertex_to_next_direction_ecs, current_vertex, new_vertex);
		
		vec3 current_vertex_to_next_transport_operator = current_vertex_brdf * current_vertex_geom;

		// multiply the current set of transport operators with the new
		point_transport_operators					*= current_vertex_to_next_transport_operator;
		point_transport_inverse_probabilities		*= current_vertex_to_next_inverse_probability;

		vec3 path_color = vec3(0);
			
		// connect new vertex to light (for direct lighting next event estimation) and get transport operator
		vec3 new_vertex_light_position_ecs = light_position_ecs;		
		vec3 new_vertex_to_light_direction_ecs	= new_vertex_light_position_ecs - new_vertex.position;
		float new_vertex_to_light_dist2			= dot(new_vertex_to_light_direction_ecs, new_vertex_to_light_direction_ecs);
		new_vertex_to_light_direction_ecs		= normalize(new_vertex_to_light_direction_ecs);
		
		// check if the vertex is in shadow (e.g. via shadow mapping)
		float in_shadow = 1.0; //shadow(new_vertex.position);
		// if we didnt hit an object, we hit the light source
		if (in_shadow > 0.0)
		{
			vec3 new_vertex_to_prev_direction_ecs	= current_vertex.position - new_vertex.position;
			new_vertex_to_prev_direction_ecs		= normalize(new_vertex_to_prev_direction_ecs);
			
			// retrieve the BSDF and the geometric term for the next vertex->light
			vec3 new_vertex_to_light_brdf			= vec3(1);  // getBSDF(new_vertex_to_light_direction_ecs.xyz, new_vertex_to_prev_direction_ecs.xyz, new_vertex);
			float new_vertex_to_light_geom			= 1.0 		// getGeometricTerm(new_vertex_to_light_direction_ecs, new_vertex);
			vec3 new_vertex_to_light_transport_operator = new_vertex_to_light_brdf * new_vertex_to_light_geom * in_shadow;
		
			path_color								= new_vertex_to_light_transport_operator * light_color_intensity / new_vertex_to_light_dist2;
			path_color								*= point_transport_operators * point_transport_inverse_probabilities;
		}
		// add any emission
		// path_color.xyz	+= point_transport_operators * point_transport_inverse_probabilities * emission;

		final_color.xyz += path_color;

		// reset
		// set previous vertex as the current
		// only the position is needed here (for the vector)
		prev_vertex_position_ecs = current_vertex.position;

		// set new vertex's data as the current one
		current_vertex = new_vertex;
	}	

	// if there is no hit, add the sky contribution, such as:
	// A. J. Preetham, P. Shirley, B. E. Smits. A Practical Analytic Model for Daylight. Computer Graphics (Proceedings of SIGGRAPH 1999)
	// http://dl.acm.org/citation.cfm?id=311545
	if (!has_hit)
	{		
		// final_color.xyz += sky_color;
	}

	store_color(final_color.xyz);
}
