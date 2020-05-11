#version 420 core

layout(binding = 0, r32ui)				readonly uniform uimage2D		image_layers;
layout(binding = 1, r32f)				readonly uniform image2D		image_importance;
layout(binding = 2, r32ui)	    		writeonly uniform uimage2D		image_k_map;

uint	getLayers				() 		   { return imageLoad  (image_layers	, ivec2(gl_FragCoord.xy)).r;			   		   }
float getImportance				() 		   { return imageLoad  (image_importance, ivec2(gl_FragCoord.xy)).r;			   		   }
void  setMaxPixelKValue			(uint val) { 		imageStore (image_k_map		, ivec2(gl_FragCoord.xy), uvec4(val, 0u, 0u, 0u)); }

uniform uint uniform_total_importance;
uniform float uniform_average_k;
uniform float uniform_size; // width * height

void main(void)
{
	float importance = getImportance();
	if (importance <= 0) return;
	
	float total_buffer_size = uniform_size * uniform_average_k;
	uint k_xy = uint(importance) * uint(total_buffer_size);
	k_xy /= uniform_total_importance;
	
	setMaxPixelKValue(k_xy);
}
