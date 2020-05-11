#version 420 core

in vec2 TexCoord;
uniform sampler2D sampler_fresnel;
uniform sampler2D sampler_noise;

layout(binding = 0, r32ui)				readonly uniform uimage2D		image_layers;
layout(binding = 1, offset = 0)				  uniform atomic_uint		total_importance_layers;
layout(binding = 2, r32f)				writeonly uniform image2D		image_importance;

uint getLayers() 						{ return imageLoad (image_layers, 	  ivec2(gl_FragCoord.xy)).r;					}
void storeImportance(float val) 		{ 		 imageStore(image_importance, ivec2(gl_FragCoord.xy),     vec4(val,0,0,0)); }

void main(void)
{
	uint total_layers = getLayers();
	if (total_layers == 0u) 
	{
		storeImportance(0);
		return;
	}
	
	// Noise (jittering)
	float I_noise = texture(sampler_noise).r;

	// FOViated importance (0.0 -> 1.0)
	vec2 texSize = textureSize(sampler_fresnel, 0).xy * 0.5;
	float I_fov = length(gl_FragCoord.xy - texSize) / (1.1*length(texSize));
	I_fov = pow(I_fov, 3);
	I_fov = 1 - clamp(I_fov, 0.0, 1.0);	
	
	// Depth Complexity (e.g., 0.25 -> 1)
	float max_number_layers = 30.0; 
	float I_layered = min(1.0, total_layers / max_number_layers);
	float a = 0.25;
	I_layered = (1-a) * I_layered + a;

	// Fresnel importance, based on the first (depth-ordered) fragment of the last frame (0.5 -> 1.0)
	vec4 normal_prev = texture(sampler_fresnel, TexCoord.st);
	normal_prev.x = clamp(normal_prev.x, 0, 1);
	normal_prev.x = 1-normal_prev.x;
	float I_prev = 1 - 0.5 * (normal_prev.x * normal_prev.x * normal_prev.x * normal_prev.x * normal_prev.x);
	I_prev = clamp(I_prev, 0.5, 1.0);
	
	// Calculate total (0.0 -> 1.0)
	float I = I_fov * I_layered * I_prev + I_noise;

	// store the importance
	// use a multiplier (e.g., 50) due to the absence of atomicCounterIncrement for floats
	// and use the same scalar to retrieve the importance value in the next step
	float scalar = 50.0;
	float importance = clamp(I, 0.01, 1.0) * scalar;
	uint int_importance = uint(floor(importance+0.5));
	
	storeImportance(importance);
	for (int i = 0; i < int_importance && i < int(scalar); ++i)
		atomicCounterIncrement(total_importance_layers);	
}
