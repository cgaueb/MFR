// DIRT: Deferred Image-based Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
// This file contains the fragment implementation for the creation of the mask texture via a depth texture. 
// This is very quick pass where a simple check against the head texture of the hit buffer is performed.
// Alternatively, this can be implemented using a stencil mask.

#version 440 core

layout(binding = 0, r32ui )		readonly uniform uimage2D  image_hit_buffer_head;	// the hit buffer head id texture

// gets the hit buffer head id for the current pixel
uint  getHitBufferHeadID	() { return imageLoad (image_hit_buffer_head, ivec2(gl_FragCoord.xy)).x; }

void main(void)
{
	gl_FragDepth = (getHitBufferHeadID() == 0u) ? 0.0f : 1.0f;
}