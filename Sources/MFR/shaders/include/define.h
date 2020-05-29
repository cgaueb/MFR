//---------------------------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//---------------------------------------------------------------------------------------------------------------

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

#define ARRAY_VS_HEAP		16
#define INSERTION_VS_SHELL	16

#define KB_SIZE				8
#define KB_SIZE_1n          KB_SIZE - 1
#define KB_SIZE_LOG2		log2(KB_SIZE)
#define BUCKET_SIZE			8
#define STENCIL_SIZE		((KB_SIZE < 32) ? HEAP_SIZE : 32)

#define HISTOGRAM_SIZE		1024
#define LOCAL_SIZE			32	
#define LOCAL_SIZE_1n		LOCAL_SIZE - 1

#define Packed_1f			4294967295U // 0xFFFFFFFFU

#define float_max			3.40282e+038f
#define float_min		   -3.40282e+038f
#define uint_max			4294967295