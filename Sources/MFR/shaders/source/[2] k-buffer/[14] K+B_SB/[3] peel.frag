#include "define.h"
#if NV_interlock
#extension GL_NV_fragment_shader_interlock : enable

	layout(pixel_interlock_unordered) in;
#endif
#include "s-buffer.h"

	vec4 computePixelColor();

	uniform uint *final_address[COUNTERS];

	layout(binding = 0, r32ui) coherent uniform uimage2DArray image_count_countT_next_sem;
	layout(binding = 2, rg32f) coherent uniform  imageBuffer  image_peel;

	uint getPixelFragCounter		(								  ) { return imageLoad		(image_count_countT_next_sem, ivec3(gl_FragCoord.xy,0)).r;}
	void setPixelFragCounter		(const uvec4 val				  ) {		 imageStore		(image_count_countT_next_sem, ivec3(gl_FragCoord.xy,0), val);}
	uint getPixelFragCounterTotal	(								  ) { return imageLoad		(image_count_countT_next_sem, ivec3(gl_FragCoord.xy,1)).r;}
	uint getPixelFragNextAddress	(								  ) { return imageLoad		(image_count_countT_next_sem, ivec3(gl_FragCoord.xy,2)).r;}

	vec4 sharedPoolGetValue			(const uint index				  ) { return imageLoad	(image_peel, int(index));}
	void sharedPoolSetValue			(const uint index, const vec4 val ) {		 imageStore	(image_peel, int(index), val);}

#if !(INTEL_ordering | NV_interlock)
	bool semaphoreAcquire			(								  ) {return  imageAtomicExchange (image_count_countT_next_sem, ivec3(gl_FragCoord.xy,3), 1U)==0U;}
	void semaphoreRelease			(								  ) {		 imageStore			 (image_count_countT_next_sem, ivec3(gl_FragCoord.xy,3), uvec4(0U));}
#endif 

	uint  parentHeap(const uint j) {return (j-1U) >> 1U;}
	uint  leftHeap	(const uint j) {return (j<<1U) + 1U;}


	uint setMaxFromGlobalArray(uint start)
	{	
		vec3 maxFR = vec3(0.0f,0.0f,-1.0f);
		for(uint s=start+HEAP_SIZE_1n; s>start; s--)
		{
			vec2 peel = sharedPoolGetValue(s).rg;
			if(maxFR.g < peel.g)
			{
				maxFR.r = peel.r;
				maxFR.g = peel.g;
				maxFR.b = s;
			}
		}	
		
		uint id;
		if(gl_FragCoord.z < maxFR.g)
		{
			id = uint(maxFR.b);
			sharedPoolSetValue(start, vec4(maxFR.r, maxFR.g, 0.0f, 0.0f));
		}
		else
			id  = start;

		return id;
	}

	void insertFragmentArray(uint start, float C)
	{
		uint  id, counter = getPixelFragCounter();

		if(counter < HEAP_SIZE)
		{	
			if(counter == HEAP_SIZE_1n)
			{
				sharedPoolSetValue(start+HEAP_SIZE_1n, sharedPoolGetValue(start));
				sharedPoolSetValue(start, vec4(1.0f));

				id = setMaxFromGlobalArray(start);
			}
			else
				id = start + counter;
			setPixelFragCounter(uvec4(counter+1U, 0U, 0U, 0U));
		}
		else
		{
			if(gl_FragCoord.z < sharedPoolGetValue(start).g)
				id = setMaxFromGlobalArray(start);
			else
				return;
		}

		sharedPoolSetValue(id, vec4(C, gl_FragCoord.z, 0.0f, 0.0f));
	}

	void maxHeapify(uint start, float C)
	{
		if(gl_FragCoord.z >= sharedPoolGetValue(start).g)
			return;

		uint    P;
		uint	I = 0U;
		uint    L = 1U;
		uint    R = 2U;

		uint	idI = start;
		uint	idP;

		vec4	Zl = sharedPoolGetValue(start + L);
		vec4	Zr = sharedPoolGetValue(start + R);

		for (int j=0; j<HEAP_SIZE_LOG2; j++)
		{
			float Z = gl_FragCoord.z;
			if(L < HEAP_SIZE && Z < Zl.g)
			{
				P = L;
				Z = Zl.g;
			}
			else
				P = I;

			if(R < HEAP_SIZE && Z < Zr.g)
				P = R;

			if(P != I)
			{
				idP = start + P;

				sharedPoolSetValue(idI, sharedPoolGetValue(idP));

				I = P;				idI = start + I;
				L = leftHeap(I);	Zl  = sharedPoolGetValue(start + L);
				R = L + 1U;			Zr  = sharedPoolGetValue(start + R);
			}
			else
				break;
		}

		sharedPoolSetValue(idI, vec4(C,gl_FragCoord.z,0.0f,0.0f));
	}

	void insertFragmentHeap(uint start, float C)
	{
		uint counter = getPixelFragCounter();

		if (counter == HEAP_SIZE)
			maxHeapify(start, C);
		else
		{
			uint i = counter;
			uint p = parentHeap(i);

			uint id;
			vec4 Zp;
			while (i > 0U && gl_FragCoord.z > (Zp = sharedPoolGetValue(start + p)).g)
			{
				id = start + i;
				sharedPoolSetValue(id, Zp);

				i = p;
				p = parentHeap(i);
			}
			
			id = start + i;
			sharedPoolSetValue(id, vec4(C, gl_FragCoord.z, 0.0f, 0.0f));

			setPixelFragCounter(uvec4(counter+1U, 0U, 0U, 0U));
		}
	}

	void main(void)
	{
		uint  address = getPixelFragNextAddress();
		int   hash_id = hashFunction(ivec2(gl_FragCoord.y));
		uint  start   = (*final_address[hash_id]) + address;

		float C = uintBitsToFloat(packUnorm4x8(computePixelColor()));

		if(getPixelFragCounter() < HEAP_SIZE || gl_FragCoord.z < sharedPoolGetValue(start).g)
		{
#if		INTEL_ordering
			beginFragmentShaderOrderingINTEL();
#elif	NV_interlock
			beginInvocationInterlockNV();
#else
			int  iter=0;
			bool stay_loop = true;
			while (stay_loop && iter++ < MAX_ITERATIONS)
			{
				if (semaphoreAcquire())
				{
#endif
					if(getPixelFragCounterTotal() < ARRAY_VS_HEAP)
						insertFragmentArray(start, C);
					else
						insertFragmentHeap(start, C);

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