// Copyright 2015-2024, University of Colorado Boulder

/* eslint-env node */


/**
 * Takes in a mipmap object with data/width/height and returns another mipmap object with data/width/height that is
 * downscaled by a factor of 2. Needs to round the width/height up to include all of the image (if it's not a
 * power of 2).
 *
 * mipmap.data should be array-accessible with bytes (typed array, Buffer, etc.)
 *
 * Handles alpha blending of 4 pixels into 1, and does so with the proper gamma corrections so that we only add/blend
 * colors in the linear sRGB colorspace.
 *
 * @param {Object} mipmap - Mipmap object with { data: {Buffer}, width: {number}, height: {number} }
 * @param {function} createData - function( width, height ), creates an array-accessible data container, Buffer
 *                                for Node.js, or presumably a typed array otherwise, with 4*width*height components
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
function mipmapDownscale( mipmap, createData ) {
  // array index constants for the channels
  const R = 0;
  const G = 1;
  const B = 2;
  const A = 3;

  // hard-coded gamma (assuming the exponential part of the sRGB curve as a simplification)
  const GAMMA = 2.2;

  // dimension handling for the larger image
  const width = mipmap.width;
  const height = mipmap.height;
  const data = mipmap.data;

  function inside( row, col ) {
    return row < height && col < width;
  }

  // grabbing pixel data for a row/col, applying corrections into the [0,1] range.
  function pixel( row, col ) {
    if ( !inside( row, col ) ) {
      return [ 0, 0, 0, 0 ];
    }
    const index = 4 * ( row * width + col );
    return [
      // maps to [0,1]
      Math.pow( data[ index + R ] / 255, GAMMA ), // red
      Math.pow( data[ index + G ] / 255, GAMMA ), // green
      Math.pow( data[ index + B ] / 255, GAMMA ), // blue
      Math.pow( data[ index + A ] / 255, GAMMA ) // alpha
    ];
  }

  // dimension h andling for the smaller downscaled image
  const smallWidth = Math.ceil( width / 2 );
  const smallHeight = Math.ceil( height / 2 );
  const smallData = createData( smallWidth, smallHeight );

  function smallPixel( row, col ) {
    return 4 * ( row * smallWidth + col );
  }

  // for each pixel in our downscaled image
  for ( let row = 0; row < height; row++ ) {
    for ( let col = 0; col < width; col++ ) {
      // Original pixel values for the quadrant
      const p1 = pixel( 2 * row, 2 * col ); // upper-left
      const p2 = pixel( 2 * row, 2 * col + 1 ); // upper-right
      const p3 = pixel( 2 * row + 1, 2 * col ); // lower-left
      const p4 = pixel( 2 * row + 1, 2 * col + 1 ); // lower-right
      const output = [ 0, 0, 0, 0 ];

      const alphaSum = p1[ A ] + p2[ A ] + p3[ A ] + p4[ A ];

      // blending of pixels, weighted by alphas
      output[ R ] = ( p1[ R ] * p1[ A ] + p2[ R ] * p2[ A ] + p3[ R ] * p3[ A ] + p4[ R ] * p4[ A ] ) / alphaSum;
      output[ G ] = ( p1[ G ] * p1[ A ] + p2[ G ] * p2[ A ] + p3[ G ] * p3[ A ] + p4[ G ] * p4[ A ] ) / alphaSum;
      output[ B ] = ( p1[ B ] * p1[ A ] + p2[ B ] * p2[ A ] + p3[ B ] * p3[ A ] + p4[ B ] * p4[ A ] ) / alphaSum;
      output[ A ] = alphaSum / 4; // average of alphas

      // convert back into [0,255] range with reverse corrections, and store in our buffer
      const outputIndex = smallPixel( row, col );
      smallData[ outputIndex + R ] = Math.floor( Math.pow( output[ R ], 1 / GAMMA ) * 255 );
      smallData[ outputIndex + G ] = Math.floor( Math.pow( output[ G ], 1 / GAMMA ) * 255 );
      smallData[ outputIndex + B ] = Math.floor( Math.pow( output[ B ], 1 / GAMMA ) * 255 );
      smallData[ outputIndex + A ] = Math.floor( Math.pow( output[ A ], 1 / GAMMA ) * 255 );
    }
  }

  return {
    data: smallData,
    width: smallWidth,
    height: smallHeight
  };
}

module.exports = mipmapDownscale;