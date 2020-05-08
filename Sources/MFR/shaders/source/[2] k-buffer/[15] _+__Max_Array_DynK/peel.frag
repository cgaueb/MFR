#include "define.h"
#if NV_interlock
#extension GL_NV_fragment_shader_interlock : enable

	layout(pixel_interlock_unordered) in;
#endif

	uniform int K_SIZE;

	vec4 computePixelColor();
	
	layout(binding = 0, r32ui) coherent uniform uimage2DRect  image_counter;
	layout(binding = 2, rg32f) coherent uniform  image2DArray image_peel;
#if !(INTEL_ordering | NV_interlock)
	layout(binding = 1, r32ui) coherent uniform uimage2DRect  image_semaphore;
	bool  semaphoreAcquire		(								   ) { return  imageAtomicExchange 	(image_semaphore, ivec2(gl_FragCoord.xy), 1U)==0U;}
	void  semaphoreRelease		(								   ) {		   imageStore			(image_semaphore, ivec2(gl_FragCoord.xy), uvec4(0U));}
#endif

	vec4  getPixelFragValue(const int coord_z										) { return	imageLoad  (image_peel, ivec3(gl_FragCoord.xy, coord_z));}
	void  setPixelFragValue(const int coord_z, const float color, const float depth	) {			imageStore (image_peel, ivec3(gl_FragCoord.xy, coord_z), vec4(color, depth, 0.0f, 0.0f));}
	
	void  setPixelFragCounter	(const uvec4 val)					 {	      imageStore (image_counter, ivec2(gl_FragCoord.xy), val);}
	uint  getPixelFragCounter	(				)					 { return imageLoad  (image_counter, ivec2(gl_FragCoord.xy)).r;}

	int setMaxFromGlobalArray()
	{
		int id;
		vec3 maxFR = vec3(0.0f,0.0f,-1.0f);
		
		for(int i=K_SIZE-1; i>0; i--)
		{
			vec2 peel = getPixelFragValue(i).rg;
			if(maxFR.g < peel.g)
			{
				maxFR.r = peel.r;
				maxFR.g = peel.g;
				maxFR.b = i;
			}
		}

		if(gl_FragCoord.z < maxFR.g)
		{
			id = int(maxFR.b);
			setPixelFragValue(0, maxFR.r, maxFR.g);
		}
		else
			id = 0;

		return id;
	}

	void insertFragmentArrayMax(float C)
	{
		int id = int(getPixelFragCounter());
		if(id < K_SIZE)
		{
			setPixelFragCounter(uvec4(id+1U, 0U, 0U, 0U));
			id = (id == K_SIZE-1) ? setMaxFromGlobalArray() : K_SIZE-1-id;
		}
		else
		{
			if(gl_FragCoord.z < getPixelFragValue(0).g)
				id = setMaxFromGlobalArray();
			else
				return;
		}

		setPixelFragValue(id, C, gl_FragCoord.z);
	}

	void main(void)
	{		
		float C = uintBitsToFloat(packUnorm4x8(computePixelColor()));

		if(gl_FragCoord.z < getPixelFragValue(0).g)
		{
#if		INTEL_ordering
			beginFragmentShaderOrderingINTEL();
#elif	NV_interlock
			beginInvocationInterlockNV();
#else
			int iter = 0;
			bool stay_loop = true;
			while (stay_loop && iter++ < MAX_ITERATIONS)
			{
				if (semaphoreAcquire())
				{
#endif
					insertFragmentArrayMax(C);
#if		!(INTEL_ordering | NV_interlock)
					semaphoreRelease();
					stay_loop = false;
				}
			}
#endif
#if		NV_interlock
			endInvocationInterlockNV();
#endif
		}
	}