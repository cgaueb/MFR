	struct NodeTypeArray
	{
		float depth;
		uint  color;
	};
	
	struct NodeTypeArray64
	{
		uint64_t color32_depth32;
	};

	struct NodeTypeLL
	{
		float depth;
		uint  color;
		uint  next;
	};