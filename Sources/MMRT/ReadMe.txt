// A Multiview and Multilayer Approach for Interactive Ray Tracing
// Authors: K. Vardis, A. A. Vasilakis, G. Papaioannou
These folders contain fragment shader source code used in the paper.

Folder: GLSL->A-Buffer Shaders
Source code for the construction of the various A-Buffer methods used 
in Section 4.3 for performing the tracing test.

AB_LL		: Linked-List [YHG*10]
AB_LL_BUN	: Linked-List with Buckets [VF13]
AB_LLD		: Double Linked-List
AB_LLD_BUN	: Double Linked-List with Buckets
AB_SB		: S-Buffer [VF12]
Note: The folders with suffix <_Decoupled> use the Data buffer to store any fragment data required during shading.

Folder: GLSL->Cubemap Shaders
Source code for the construction of the multiview A-buffer with its path tracing and ambient occlusion
implementations.

Folder: GLSL->Include files
Common files required for the construction of the A-buffers.

									*** References ***

[PBD*10] Steven G. Parker, James Bigler, Andreas Dietrich, Heiko Friedrich, Jared Hoberock, David Luebke, David McAllister, Morgan McGuire, Keith Morley, Austin Robison, and Martin Stich. 2010. OptiX: a general purpose ray tracing engine. In ACM SIGGRAPH 2010 papers (SIGGRAPH '10), Hugues Hoppe (Ed.). ACM, New York, NY, USA, , Article 66 , 13 pages. DOI=http://dx.doi.org/10.1145/1833349.1778803
									
[YHG*10] Jason C. Yang, Justin Hensley, Holger Grün, and Nicolas Thibieroz. 2010. Real-time concurrent linked list construction on the GPU. In Proceedings of the 21st Eurographics conference on Rendering (EGSR'10). Eurographics Association, Aire-la-Ville, Switzerland, Switzerland, 1297-1304. 
DOI=http://dx.doi.org/10.1111/j.1467-8659.2010.01725.x.

[VF13] Andreas A. Vasilakis and Ioannis Fudos. 2013. Depth-Fighting Aware Methods for Multifragment Rendering. IEEE Transactions on Visualization and Computer Graphics 19, 6 (June 2013), 967-977. DOI=http://dx.doi.org/10.1109/TVCG.2012.300

[VF12] Andreas A. Vasilakis and Ioannis Fudos, S-buffer: Sparsity-aware Multi-fragment Rendering, In Proceedings of Eurographics 2012, Short Papers, pp. 101-104, Cagliari, Italy, May 13-18, 2012. 
DOI=http://dx.doi.org/10.2312/conf/EG2012/short/101-104