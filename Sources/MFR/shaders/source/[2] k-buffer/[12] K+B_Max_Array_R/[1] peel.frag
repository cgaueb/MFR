#include "define.h"

#if NV_interlock
#extension GL_NV_fragment_shader_interlock : enable

	layout(pixel_interlock_unordered) in;
#endif

	vec4 computePixelColor();

	layout(binding = 0, r32ui) coherent uniform uimage2DRect  image_counter;
	layout(binding = 1, r32ui) coherent uniform uimage2DRect  image_semaphore;
	layout(binding = 2, rg32f) coherent uniform  image2DArray image_peel;

#if multipass
	layout(binding = 6)					uniform sampler2DRect tex_depth;
	float getPixelDepthPrevMax  (									 ){return	texture			(tex_depth	  , gl_FragCoord.xy).r;}
#endif

	vec4  getPixelFragValue		(const int coord_z					 ){return	imageLoad		(image_peel	  , ivec3(gl_FragCoord.xy, coord_z));}
	void  setPixelFragValue		(const int coord_z, const float color, const float depth){ 
																				imageStore		(image_peel	  , ivec3(gl_FragCoord.xy, coord_z),  vec4(color, depth, 0.0f, 0.0f));}
	uint  addPixelFragCounter	(									 ){return	imageAtomicAdd	(image_counter, ivec2(gl_FragCoord.xy), 1U);}

#if !(INTEL_ordering | NV_interlock)
	bool  semaphoreAcquire		(								   ) { return  imageAtomicExchange 	(image_semaphore, ivec2(gl_FragCoord.xy), 1U)==0U;}
	void  semaphoreRelease		(								   ) {		   imageStore			(image_semaphore, ivec2(gl_FragCoord.xy), uvec4(0U));}
#endif

	int setMaxFromGlobalArray()
	{
		vec3 maxFR = vec3(0.0f,0.0f,-1.0f);	
		for(int i=HEAP_SIZE_1n; i>0; i--)
		{
			vec2 Zi = getPixelFragValue(i).rg;
			if(maxFR.g < Zi.g)
			{
				maxFR.r = Zi.r;
				maxFR.g = Zi.g;
				maxFR.b = i;
			}
		}

		int id;
		if(gl_FragCoord.z < maxFR.g)
		{
			id = int(maxFR.b);
			setPixelFragValue(0, maxFR.r, maxFR.g);
		}
		else
			id = 0;

		return id;
	}

	void insertFragmentArrayMax(int index, float C)
	{
		if(gl_FragCoord.z < getPixelFragValue(0).g)
			setPixelFragValue(setMaxFromGlobalArray(), C, gl_FragCoord.z);
	}

	void main(void)
	{

#if multipass
		if(gl_FragCoord.z <= getPixelDepthPrevMax())
			discard;
#endif
		float C = uintBitsToFloat(packUnorm4x8(computePixelColor()));

		int id = int(addPixelFragCounter());
		if (id < HEAP_SIZE_1n)
			setPixelFragValue(HEAP_SIZE_1n-id, C, gl_FragCoord.z);
		else if (gl_FragCoord.z < getPixelFragValue(0).g)
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
					insertFragmentArrayMax(id, C);
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