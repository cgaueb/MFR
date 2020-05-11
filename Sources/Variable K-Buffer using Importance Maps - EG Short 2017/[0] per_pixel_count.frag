#version 420 core
// use the available depth buffer to avoid invoking the fragment shader 
// on transparent areas are covered by opaque surfaces
layout(early_fragment_tests) in;

uniform sampler2D sampler_opacity;

in vec2 TexCoord;

layout(binding = 0, r32ui)			coherent uniform uimage2D		image_layers;
layout(binding = 1, offset = 0)				 uniform atomic_uint	total_layers;

uint incrementPixel	() { return imageAtomicAdd	  (image_layers, ivec2(gl_FragCoord.xy), 1u); }

void main(void)
{
	// skip any opaque pixels
	/*
	float tex_opacity = texture(sampler_opacity, TexCoord.st).x;
	if (tex_opacity.a == 0.0) return;
	*/
	
	incrementPixel();
	atomicCounterIncrement(total_layers);
}
