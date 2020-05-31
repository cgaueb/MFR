# Multifragment Rendering

## Overview

Multifragment rendering (MFR) is a genre of image synthesis techniques and associated data structures tightly coupled with the rasterisation pipeline, which has helped deliver important improvements to the visual quality of primitive-order rendering and has enabled the real-time display of complex phenomena and structures. An MFR method encompasses the algorithms and image-space data structures that are necessary to produce, maintain, process and exploit a set of geometry fragments that are associated with a single image, in the sense that multiple samples correspond to the same location in image space.

The main advantage of these approaches is that they encompass additional rasterised geometry, by retaining more information from the fragment sampling domain, thus augmenting the visibility determination stage. For more details, please refer to the recent <a href="Multimedia\EG2020_STAR_paper.pdf"> state-of-the-art report </a> which was presented at the Eurographics 2020 conference. 

![Image description](Figures/teaser.png)
**Figure 1.** Multifragment rendering has been deployed in a wide spectrum of rendering applications in order to generate compelling graphics effects at interactive frame rates.


### Table of Contents

- [Aim](#Aim)
- [Pipeline](#Pipeline)
- [Downloads](#Downloads)
- [How to Cite](#How-to-Cite)
- [References](#References)

## Aim

The goals of this github repository are to:
- Present formally the MFR pipeline.
- Offer a centralised location that contains source code and examples of the MFR-related research that has been done by the [CG AUEB Group](http://graphics.cs.aueb.gr).
- Provide a generalised MFR framework for prototyping constructions methodologies and their applications, ranging from order-independent transparency to global illumination and data visualisation.

## Pipeline

At a conceptual level, the complex primary visibility determination is part of a more general multifragment pipeline responsible for generating, storing, processing and evaluating information from incoming fragments (Fig. 2, top). This pipeline is comprised of three main steps: _construction_, _operation_ and _image composition_, which are defined by the context of the particular _application_ in mind. The _construction_ step is responsible for generating and storing per-pixel fragments through a common rasterisation procedure. Even though _storing_ and _sorting_ are two fundamental building blocks of the construction step, the latter stage is implicitly or explicitly performed. After construction has taken place, the next step performs one or more _operations_ on the ordered fragment data structure. Finally, the _application_ accesses and exploits the fragment information stored in the MFR structure to compose the final output (Fig. 2, bottom).

<p align="center">
  <img src="Figures/multifragment_pipeline.png">
</p>

**Figure 2.** Diagram of building an application using the MFR pipeline (top). For example, Order-independent transparency requires the sorting of an arbitrary sequence of out-of-order fragments before alpha
compositing them in a linear traversal fashion (bottom).

## Downloads

### GLSL Source Code

A comprehensive shader source code bundle for efficiently solving the visibility determination problem in screen space is provided. This extensive collection includes the most widely-used multi-fragment rendering solutions such as the depth peeling variants as well as k-buffer and A-buffer alternatives (summarized in our recent survey [[VVP20]](#[VVP20])). The source code is mainly written using the OpenGL 4.4 API, except from the parts that do not require GPU-accelerated atomic memory operations (OpenGL 3.3).

#### Data Structures
|  Name/Location | Methodology | Citation |
| ---            | ---               | ---      |
| [**Depth Peeling**](Sources/MFR/shaders/source/Depth_Peeling) ||
| [F2B](Sources/MFR/shaders/source/Depth_Peeling/F2B/Original)                 | Front-to-back (Forward)                 | [[Eve01]](#[Eve01])   |
| [F2B_D](Sources/MFR/shaders/source/Depth_Peeling/F2B/Deferred)               | Front-to-back (Deferred)                | [[VF13]](#[VF13])     |
| [F2B_ZF](Sources/MFR/shaders/source/Depth_Peeling/F2B/Z-Fighting)            | Front-to-back (Z-fighting)              | [[VF13]](#[VF13])     |
| [DUAL](Sources/MFR/shaders/source/Depth_Peeling/DUAL)                        | Dual                                    | [[BM08b]](#[BM08b]) |
| [BUN](Sources/MFR/shaders/source/Depth_Peeling/Bucket_Uniform)               | Uniform Buckets                         | [[LHLW09]](#[LHLW09]) |
| [**A-buffer**](Sources/MFR/shaders/source/A-buffer) ||        
| [AB_LL](Sources/MFR/shaders/source/A-buffer/Linked_Lists/Original)           | Linked-Lists                            | [[YHG*10]](#[YHG*10]) |
| [AB_LL_D](Sources/MFR/shaders/source/A-buffer/Linked_Lists/Double)           | Linked-Lists (Double)                   | [[VVP16a]](#[VVP16a]) |
| [AB_LL_BUN](Sources/MFR/shaders/source/A-buffer/Linked_Lists/Bucket_Uniform) | Linked-Lists (Uniform Buckets)          | [[VF13]](#[VF13])     |
| [AB_AF](Sources/MFR/shaders/source/A-buffer/Arrays/Fixed)                    | Arrays (Fixed)                          | [[Cra10a]](#[Cra10a]) |
| [AB_AV](Sources/MFR/shaders/source/A-buffer/Arrays/Variable)                 | Arrays (Variable)                       | [[VF12]](#[VF12])     |
| [**k-buffer**](Sources/MFR/shaders/source/k-buffer) ||        
| [KB](Sources/MFR/shaders/source/k-buffer/Fixed/Original)                     | Fixed Arrays                            | [[BCL*07]](#[BCL*07])   |
| [KB_SR](Sources/MFR/shaders/source/k-buffer/Fixed/Stencil_Routed)            | Fixed Arrays (Stencil-routed)           | [[BM08a]](#[BM08a])   |
| [KB_MULTI](Sources/MFR/shaders/source/k-buffer/Fixed/Multipass)              | Fixed Arrays (Multipass)                | [[LWXW*09]](#[LWXW*09]) |
| [KB_AB_LL](Sources/MFR/shaders/source/k-buffer/Fixed/AB_Linked_Lists)        | Fixed Arrays (A-buffer, Linked Lists)   | [[SML11]](#[SML11])     |
| [KB_LL](Sources/MFR/shaders/source/k-buffer/Linked_Lists)                    | Linked Lists                            | [[YYH∗12]](#[YYH∗12])   |
| [KB_PS](Sources/MFR/shaders/source/k-buffer/Fixed/Pixel_Synchronized)        | Fixed Arrays (Pixel Synchronized)       | [[Sal13]](#[Sal13])     |
| [KB_MDT_32](Sources/MFR/shaders/source/k-buffer/Fixed/Multidepth_Test_32)    | Fixed Arrays (Multidepth Testing 32bit) | [[MCTB13]](#[MCTB13])   |
| [KB_MDT_64](Sources/MFR/shaders/source/k-buffer/Fixed/Multidepth_Test_64)    | Fixed Arrays (Multidepth Testing 64bit) | [[Kub14]](#[Kub14])     |
| [KB_MAX_ARRAY](Sources/MFR/shaders/source/k-buffer/Fixed/Max_Array)          | Fixed Arrays (Max Array)                | [[VF14]](#[VF14])       |
| [KB_MAX_HEAP](Sources/MFR/shaders/source/k-buffer/Fixed/Max_Heap)            | Fixed Arrays (Max Heap)                 | [[VF14]](#[VF14])       |

<!--
#### Sorting Solutions
|  Location | Description | Citation |
|  --- | --- | --- |
| [Sort local](Sources/MFR/shaders/source) |Sort local | [YHG*10](#[YHG*10]) |
-->

### Demos

- A simple forward rendering engine that can be used as a research prototyping platform for testing various MFR algorithms for shading and illumination effects using modern OpenGL. (TBD)
- Screen-space Ray Tracing demos from [VVP16a](#[VVP16a]) and [VVP16b](#[VVP16b]) papers can be found 
<a href="http://graphics.cs.aueb.gr/graphics/downloads.html">here</a>.

### Research Content

- Evangelou I., Papaioannou G., Vardis K., Vasilakis A. A., '_Rasterization-based Progressive Photon Mapping_', _conditionally accepted_ at The Visual Computer (CGI'2020 Special Issue). <img src="Figures\new.png" width="40">
- Vasilakis A. A., Vardis K., Papaioannou G., '*[A Survey of Multifragment Rendering](https://diglib.eg.org/handle/10.1111/cgf14019)*', Computer Graphics Forum (Eurographics 2020 - STAR Papers). 
<a href="Multimedia\EG2020_STAR_paper.pdf"> <img alt="EG 2020 paper pdf" src="Figures\pdf.png" width="25"> </a>
<a href="Multimedia\EG2020_STAR_presentation.pptx"> <img alt="EG 2020 presentation" src="Figures\pptx.png" width="25"> </a>
<a href="https://youtu.be/bxX8BVxfbYA"> <img alt="EG 2020 video" src="Figures\video.png" width="25"> </a>
- Vasilakis A. A., Vardis K., Papaioannou G. and Moustakas K.,'*[Variable k-buffer using Importance Maps](https://diglib.eg.org/handle/10.2312/egsh20171005)*', Eurographics 2017 - Short Papers. <a href="Multimedia\EG2017_SP_paper.pdf"> <img alt="EG 2017 paper pdf" src="Figures\pdf.png" width="25"></a> 
<a href="Multimedia\EG2017_SP_presentation.pptx"> <img alt="EG 2017 presentation" src="Figures\pptx.png" width="25"> </a>
- Vardis K., Vasilakis A. A., Papaioannou G., '*[DIRT: Deferred Image-based Ray Tracing](http://diglib.eg.org/handle/10.2312/hpg20161193)*', High-Performance Graphics 2016.
<a href="Multimedia\HPG2016_paper.pdf"> <img alt="HPG 2016 paper pdf" src="Figures\pdf.png" width="25"> </a>
<a href="https://www.kostasvardis.com/files/research/dirt_hpg2016.pptx"> <img alt="HPG 2016 presentation" src="Figures\pptx.png" width="25"> </a>
- Vardis K., Vasilakis A. A., Papaioannou G., '*[A Multiview and Multilayer Approach for Interactive Ray Tracing](http://dl.acm.org/citation.cfm?id=2856401)*', Interactive 3D Graphics and Games 2016. <a href="Multimedia\I3D2016_paper.pdf"> <img alt="I3D 2016 paper pdf" src="Figures\pdf.png" width="25"> </a> <a href="https://www.kostasvardis.com/files/research/mmrt_i3d2016.pptx"> <img alt="I3D 2016 presentation" src="Figures\pptx.png" width="25"> </a> <a href="https://youtu.be/0yLrVZGNFlA"> <img alt="I3D 2016 video" src="Figures\video.png" width="25"> </a>
- Vasilakis A. A., Papaioannou G., Fudos I. '*[k<sup>+</sup>-buffer: An efficient, memory-friendly and dynamic k-buffer framework](https://ieeexplore.ieee.org/document/7070744)*', TVCG, 2015. <a href="Multimedia\TVCG2015_paper.pdf"> <img alt="TVCG 2015 paper pdf" src="Figures\pdf.png" width="25"> </a>
- Vasilakis A. A., Papaioannou G., '*[Improving k-buffer methods via Occupancy Maps](https://diglib.eg.org/handle/10.2312/egsh.20151017.069-072)*', Eurographics 2015 - Short Papers. <a href="Multimedia\EG2015_SP_paper.pdf"> <img alt="EG 2015 paper pdf" src="Figures\pdf.png" width="25"> </a> <a href="Multimedia\EG2015_SP_presentation.pptx"> <img alt="EG 2015 presentation" src="Figures\pptx.png" width="25"> </a>

## How to Cite
The license is [MIT](LICENSE). If you use the contents of this repository for your work, please cite it as described below:

### LaTeX and BibTeX example usage

<blockquote>
<pre style="white-space:pre-wrap;">
In our work, we have used the shader source code~\cite{VVP_EG_2020_STAR}, available at <em>'https://github.com/cgaueb/MFR'</em> repository, that implements the algorithm described in the research paper~\cite{XXX}.
</pre>

<pre style="white-space:pre-wrap;">
@article{VVP_EG_2020_STAR,
    title   = {A Survey of Multifragment Rendering},
    author  = {Vasilakis, Andreas Alexandros and Vardis, Konstantinos and Papaioannou, Georgios},
    journal = {Computer Graphics Forum},
    volume  = {39},
    number  = {2},
    pages   = {623-642},
    year    = {2020},
    issn    = {1467-8659},
    doi     = {10.1111/cgf.14019},
    publisher = {The Eurographics Association and John Wiley & Sons Ltd.}
}

</pre>
</blockquote>

## References

### Survey

- <a name="[VVP20]"> [VVP20]  </a> Vasilakis et al., "A Survey of Multifragment Rendering", CGF (EG STAR), 2020.

### Depth Peeling

- <a name="[Eve01]"> [Eve01]  </a> Everitt, "Interactive Order-Independent Transparency", Tech. rep., Nvidia Corporation, 2001.
- <a name="[BM08b]"> [BM08b] </a> Bavoil and Myers, "Order Independent Transparency with Dual Depth Peeling", Tech. rep., Nvidia Corporation, 2008.
- <a name="[LHLW09]">[LHLW09] </a> Liu et al., "Efficient Depth Peeling via Bucket Sort", HPG, 2009.
- <a name="[VF13]">  [VF13]   </a> Vasilakis and Fudos, "Depth-Fighting Aware Methods for Multifragment Rendering", TVCG, 2013.
 
### k-buffer

- <a name="[BCL*07]">[BCL*07]  </a> Bavoil et al., "Multi-fragment Effects on the GPU Using the k-buffer", I3D, 2007.
- <a name="[BM08a]"> [BM08a]   </a> Bavoil and Myers, "Deferred Rendering using a Stencil Routed k-Buffer", ShaderX6: Advanced Rendering Techniques, 2008.
- <a name="[LWXW*09]">[LWXW*09]</a> Liu et al., "Multi-layer depth peeling via fragment sort", CAD&CG, 2009.
- <a name="[SML11]"> [SML11]   </a> Salvi et al., "Adaptive Transparency", HPG, 2011.
- <a name="[YYH∗12]">[YYH∗12]  </a> Yu et al., "A Framework for Rendering Complex Scattering Effects on Hair", I3D, 2012.
- <a name="[MCTB13]">[MCTB13]  </a> Maule et al., "Hybrid Transparency", I3D, 2013.
- <a name="[Sal13]"> [Sal13]   </a> Salvi, "Advances in Real-Time Rendering in Games: Pixel Synchronization: Solving old graphics problems with new data structures", SIGGRAPH Courses, 2013.
- <a name="[Kub14]"> [Kub14]   </a> Kubish, "Order Independent Transparency In OpenGL 4.x.", GTC, 2014.
- <a name="[VF14]">  [VF14]    </a> Vasilakis and Fudos, "k<sup>+</sup>-buffer: Fragment Synchronized k-buffer", I3D, 2014.
- <a name="[VP15]">  [VP15]    </a> Vasilakis and Papaioannou, "Improving k-buffer Methods via Occupancy Maps", EG (Short Papers), 2015.
- <a name="[VPF15]"> [VPF15]   </a> Vasilakis et al., "k<sup>+</sup>-buffer: An efficient, memory-friendly and dynamic k-buffer framework", TVCG, 2015.
- <a name="[VVPM17]"> [VVPM17] </a> Vasilakis et al., "Variable k-buffer using Importance Maps", EG (Short Papers), 2017.

### A-buffer

- <a name="[YHG*10]">[YHG*10] </a>Yang et al., "Real-time concurrent linked list construction on the GPU", CGF (EGSR'10), 2010.
- <a name="[Cra10a]">[Cra10a] </a>Crassin, "Fast and accurate single-pass A-buffer", Blog post, 2010.
- <a name="[Cra10b]">[Cra10b] </a>Crassin, "Linked lists of fragment pages", Blog post, 2010.
- <a name="[VF12]">  [VF12]   </a>Vasilakis and Fudos, "S-buffer: Sparsity-aware multifragment rendering", EG (Short Papers), 2012.
- <a name="[VVP16a]">[VVP16a] </a>Vardis et al., "A Multiview and Multilayer Approach for Interactive Ray Tracing", I3D, 2016.
- <a name="[VVP16b]">[VVP16b] </a>Vardis et al., "DIRT: Deferred Image-based Ray Tracing", HPG, 2016.
