// DIRT: Deferred Image-based Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
These folders contain fragment shader source code used in the paper. If any help is required, please e-mail at kvardis@aueb.gr

Folder: GLSL->Build
Source code for the Build stage of the id buffer
1. 	 Fill Depth.frag			: Computes the min/max depth bounds for each pixel by clipping the incoming primitives. If available, conservative rasterization should be used.
1.1. Fill Depth Mipmap.frag		: Computes a mipped representation of the depth bounds, used for hierarchical tracing.
2.   Fill Primitives.geom		: This provides an example of how the data is sent to multiple views and how the vertex buffer is constructed, if an explicit one is used.
2.   Fill Primitives.frag		: The geometry pass for constructing the id buffer. The primitives are also clipped here to be stored in their corresponding depth intervals (buckets). If available, conservative rasterization should be used.
2.1. Direct Visibility.frag		: The (optional) direct rendering pass. Stores shading properties for direct visibility in the shading buffer. If this is executed, a Shade pass should be also executed before entering the Traversal stage, in order to compute the direct illumination. If camera shading effects are present, this should be skipped. Conservative rasterization should not be applied here.
								  

Folder: GLSL->Tracing
Source code for the Traversal stage with the 3 passes: Trace, Fetch and Shade. This is executed iteratively, for each path event k. For example, a 2-bounce indirect illumination would require 3 iterations (k=3). However, if the optional Direct Visibility pass has been performed, 2 iterations are required.
Trace				  			: Performs multiview screen space hierarchical traversal, id buffer lookup and analytic intersection tests. All hits are stored in the hit buffer. Tracing starts from point G[k].
Fetch				   			: Fetches shading properties for all hits stored in the hit buffer. The final information is stored in the shading buffer at location G[k+1].
Shade							: Computes the lighting contributions for the current path event for the shading buffer points G[k-1], G[k], G[k+1]. A final left shift operation is performed in the shading buffer contents if another iteration is pending.

Folder: GLSL->Include
analytic_ssrt.h					: Used in the Trace pass. Functions for Hi-Z pixel skipping, bucket tracing and analytic ray-triangle intersections. Essentialy Algorithm 1 of the paper.
clip_primitives.h				: Used in the Fill Depth and Fille Primitives passes. An efficient pixel-primitive clipping implementation. Performs ray-plane clipping instead of frustum-triangle. However, it can affect traversal times when oblique primitives are present since the clipping is over-approximate.
data_structs.h		   			: Included almost everywhere. Contains definitions for all structures used in the paper.
multiview_trace_HiZ.h			: Tracing through multiple views. Each view is traversed hierachically in screen-space. Requires the Fill Depth Mipmap pass.
