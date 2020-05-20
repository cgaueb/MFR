//-----------------------------------------------------------------------------------------------
// Title:   A Survey of Multifragment Rendering
// Authors: A. A. Vasilakis*, K. Vardis*, G. Papaioannou
// Journal: Computer Graphics Forum (Eurographics 2020 - STAR track)
// (*These authors contributed equally to this work)
// Copyright (c) 2020 Computer Graphics Group, Athens University of Economics & Business
//-----------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------
// Implementation of "Deferred Front-to-back Depth Peeling" method as described in
// "Vasilakis and Fudos, Depth-Fighting Aware Methods for Multifragment Rendering, TVCG, 2013".
//
// [Iter][G2] -> 2nd Pass (Geometry) executed in each iteration.
//-----------------------------------------------------------------------------------------------

#include "define.h"

// Function declaration, the actual body of the function is application dependent
vec4 computePixelColor();

// Input Variables
layout(early_fragment_tests)    in;

// Output Variables
layout(location = 0, index = 0) out  vec4 out_frag_color;

void main(void)
{
    // Compute and return the final shading color
    out_frag_color = computePixelColor();
}