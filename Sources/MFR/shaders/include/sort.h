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

void sort(const int num)
{
	sort_insert(num);
}
