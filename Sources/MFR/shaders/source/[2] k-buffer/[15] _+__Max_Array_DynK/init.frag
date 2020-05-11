﻿#include "define.h"

	layout(binding = 2, rg32f) writeonly uniform image2DArray image_peel;

	void  resetPixelFragDepth (){ imageStore (image_peel, ivec3(gl_FragCoord.xy, 0), vec4(0.0f,1.0f,0.0f,0.0f));}

	void main(void)
	{
		resetPixelFragDepth();
	}