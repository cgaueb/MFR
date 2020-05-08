// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A.A. Vasilakis, G. Papaioannou
// 
// This file contains a basic Ambient Occlusion implementation
// which performs ray tracing in pixel increments through the multiview structure
// Two external files are required (and included later on):
// 
// File 1: "pt_abuffer_cubemap.glsl"
// This file contains the vertex construction and a-buffer tracing of a unique pixel
// for a specific abuffer implementation
// File 2: "pt_tracing.glsl"
// This file contains the implementation for tracing through multiple views.

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

// The samples checked per pixel
#define SAMPLES_PER_PIXEL __SAMPLES_PER_PIXEL__

// The number of views
#define NUM_CUBEMAPS __NUM_VIEWS__
#define MAX_FACE_LAYERS NUM_CUBEMAPS

// This is used to denote the the ray should stop when reaching the ends of the scene's extents
// if RAY_DISTANCE is defined as -1 or 0 then UNLIMITED_RAY_DISTANCE should be defined instead
#define RAY_DISTANCE __RAY_DISTANCE__
//#define UNLIMITED_RAY_DISTANCE

uniform mat4 uniform_view[NUM_CUBEMAPS];
uniform mat4 uniform_view_inverse[NUM_CUBEMAPS];
uniform mat4 uniform_proj[NUM_CUBEMAPS];
uniform mat4 uniform_proj_inverse[NUM_CUBEMAPS];
uniform mat4 uniform_pixel_proj[NUM_CUBEMAPS];
uniform float uniform_scene_length;
uniform vec2 uniform_near_far[NUM_CUBEMAPS];
uniform vec3 uniform_near_far_comb[NUM_CUBEMAPS];
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
	vec3 normal;	
	int face;
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
	uint	normal;
	*/
};

// this file contains the vertex construction and a-buffer tracing of a unique pixel
// for a specific abuffer implementation
#include "pt_abuffer_cubemap.glsl"

// this file contains the DDA implementation for multiple views
#include "pt_tracing.glsl"

//------------------------------------------------------------ SAMPLING
vec3 getUniformHemisphereSample(float iteration) {
	vec2 seed = getSamplingSeed(iteration);
	vec2 r = rand2n(seed);
	float phi = r.x*2.*pi;

	float cosTheta = 1.0 - r.y;
	float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
	return vec3(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);
} 

vec3 getNewSamplePositionUniformHemisphereSampling(out float out_inv_pdf, in Vertex vertex, float bounce)
{
	vec3 tangent = normalize(cross(vertex.normal, vec3(0.0, 1.0, 0.0)));
	vec3 bitangent = normalize(cross(vertex.normal, vec3(1.0, 0.0, 0.0)));
	
	vec3 cur_sample = getUniformHemisphereSample(bounce);
	vec3 current_vertex_sample_dir = normalize(tangent*cur_sample.x + bitangent*cur_sample.y + vertex.normal * cur_sample.z);
	// calculate pdf
	out_inv_pdf = pi / 2.0;

	return current_vertex_sample_dir;
}
//------------------------------------------------------------ SAMPLING END

// store the final value for a certain sample
// the alpha channel stores the total number of samples
// to properly weight each sample's contribution
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
	final_color.xyz = final_color.xyz + (stored_color.xyz * stored_color.a) * 1;
	final_color.xyz /= (total_samples);
	
	imageStore(image_result, ivec2(gl_FragCoord.xy), vec4(final_color.xyz, total_samples));
}

// main function
// basic ambient occlusion implementation
// by iteratively tracing a new vertex around the hemisphere of directions
void main(void)
{
	// check if the abuffer is empty
	vec3 current_vertex_coords = vec3(gl_FragCoord.xy, 0);
	bool isEmpty = isABufferEmpty(ivec2(current_vertex_coords.xy));
	if(isEmpty)
	{
		imageStore(image_result, ivec2(gl_FragCoord.xy), vec4(0,0,0, 1.0));
		return;
	}
	
	// initialize default values
	vec4 final_color = vec4(0,0,0,1);
	int	 layer = 0;	
	int result = ABUFFER_FACE_NO_HIT_EXIT;
	bool has_hit = false;

	// the z value stores the index in the linked-list for a certain pixel
	current_vertex_coords.z = getPixelHeadID(ivec3(gl_FragCoord.xy, 0));

	// the current position
	Vertex current_vertex						= createVertex(current_vertex_coords, 0);

	// the new vertex
	Vertex new_vertex;
	
	// The camera
	vec3 prev_vertex_position_ecs = vec3(0);
	
	// the sample direction
	vec3 current_vertex_sample_dir = vec3(0);
	
	float		start_occlusion = 0.0;
	float		total_occlusion = 0.0;
	vec3	occ_color = vec3(0);
	for (int i = 0; i < SAMPLES_PER_PIXEL; i++)
	{
		// trace to find a new vertex	
		vec2 seed = getSamplingSeed(i);
		vec3 r = rand3n(seed);
		float out_inv_pdf = 1.0;
		// generate a new sampling direction
		current_vertex_sample_dir = getNewSamplePositionUniformHemisphereSampling(out_inv_pdf, current_vertex, i+1);
		float jitter = r.y * 0.5 + 0.5;
		
		// trace the scene and find a new vertex position
		// if there is a hit, the returned vertex is created
		has_hit = traceScreenSpaceRay_abuffer(current_vertex.position, current_vertex_sample_dir, jitter, current_vertex.face, result, new_vertex);
		
		float result = max(0.0, dot(current_vertex_sample_dir, current_vertex.normal));
		start_occlusion += (has_hit) ? 0.0: result * out_inv_pdf;

		occ_color += (has_hit)? vec3(0) : vec3(result);
	}

	total_occlusion = start_occlusion / float(SAMPLES_PER_PIXEL);	
	final_color.xyz = vec3(total_occlusion);
	store_color(final_color.xyz);
}