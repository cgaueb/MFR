#define INTEL_ordering		0
#define NV_interlock		0

#if INTEL_ordering
#version 430 core
#else
#version 450 core
#extension GL_NV_gpu_shader5 : enable
#endif

#define packing				0
#define multipass			0

#define MAX_ITERATIONS		200

#define HEAP_SIZE			8	
#define HEAP_SIZE_1p		HEAP_SIZE + 1
#define HEAP_SIZE_1n		HEAP_SIZE - 1
#define HEAP_SIZE_2d		HEAP_SIZE >> 1
#define HEAP_SIZE_LOG2		log2(HEAP_SIZE)
#define ARRAY_VS_HEAP		16
#define INSERTION_VS_SHELL	16

#define KB_SIZE				8
#define STENCIL_SIZE		((HEAP_SIZE < 32) ? HEAP_SIZE : 32)

#define HISTOGRAM_SIZE		1024
#define LOCAL_SIZE			32	
#define LOCAL_SIZE_1n		LOCAL_SIZE - 1

#define Packed_1f			4294967295U // 0xFFFFFFFFU