	vec2 fragments [LOCAL_SIZE];

	void sort_insert(const int num)
	{
		for (int j = 1; j < num; ++j)
		{
			vec2 key = fragments[j];
			int i = j - 1;

			while (i >= 0 && fragments[i].g > key.g)
			{
				fragments[i+1] = fragments[i];
				--i;
			}
			fragments[i+1] = key;
		}
	}

	void sort_shell(const int num)
	{
		int inc = num >> 1;
		while (inc > 0)
		{
			for (int i = inc; i < num; ++i)
			{
				vec2 tmp = fragments[i];

				int j = i;
				while (j >= inc && fragments[j - inc].g > tmp.g)
				{
					fragments[j] = fragments[j - inc];
					j -= inc;
				}
				fragments[j] = tmp;
			}
			inc = int(inc / 2.2f + 0.5f);
		}
	}

	void sort	   (const int num)
	{
		if(num <= INSERTION_VS_SHELL)
			sort_insert(num);
		else
			sort_shell(num);
	}

	int setMaxFromGlobalArray(float Z)
	{
		int  id;
		vec2 maxFR = vec2(-1.0f,0.0f);
		
		for(int i=0; i<LOCAL_SIZE_1n; i++)
		{
			float Zi = fragments[i].g;
			if(maxFR.g < Zi)
			{
				maxFR.r = i;
				maxFR.g = Zi;
			}
		}

		if(Z < maxFR.g)
		{
			id = int(maxFR.r);
			fragments[LOCAL_SIZE_1n] = vec2(fragments[id].r, maxFR.g);
		}
		else
			id = LOCAL_SIZE_1n;

		return id;
	}