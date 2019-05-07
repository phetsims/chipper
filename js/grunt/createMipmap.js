// Copyright 2015, University of Colorado Boulder

'use strict';

const fs = require( 'fs' );
const grunt = require( 'grunt' );
const jpeg = require( 'jpeg-js' ); // eslint-disable-line require-statement-match
const mipmapDownscale = require( '../../../chipper/js/common/mipmapDownscale' );
const pngjs = require( 'pngjs' );

/**
 * Responsible for converting a single PNG/JPEG file to a structured list of mipmapped versions of it, each
 * at half the scale of the previous version.
 *
 * Level 0 is the original image, level 1 is a half-size image, level 2 is a quarter-size image, etc.
 *
 * For each level, a preferred encoding (PNG/JPEG) is determined. If the image doesn't need alpha information and
 * the JPEG base64 is smaller, the JPEG encoding will be used (PNG otherwise).
 *
 * The resulting object for each mipmap level will be of the form:
 * {
 *   width: {number} - width of the image provided by this level of detail
 *   height: {number} - width of the image provided by this level of detail
 *   data: {Buffer} - 1-dimensional row-major buffer holding RGBA information for the level as an array of bytes 0-255.
 *                    e.g. buffer[2] will be the blue component of the top-left pixel, buffer[4] is the red component
 *                    for the pixel to the right, etc.
 *   url: {string} - Data URL for the preferred image data
 *   buffer: {Buffer} - Raw bytes for the preferred image data (could be written to file and opened as an image)
 *   <pngURL, pngBuffer, jpgURL, jpgBuffer may also be available, but is not meant for general use>
 * }
 *
 * @param {string} filename
 * @param {number} maxLevel - An integer denoting the maximum level of detail that should be included, or -1 to include
 *                            all levels up to and including a 1x1 image.
 * @param {number} quality - An integer from 1-100 determining the quality of the image. Currently only used for the
 *                           JPEG encoding quality.
 * @returns {Prmomise} - Will be resolved with mipmaps: {Array} (consisting of the mipmap objects, mipmaps[0] will be level 0)
 */
module.exports = function createMipmap( filename, maxLevel, quality ) {
  return new Promise( ( resolve, reject ) => {
    const mipmaps = [];

    // kick everything off
    const suffix = filename.slice( -4 );
    if ( suffix === '.jpg' ) {
      loadJPEG();
    }
    else if ( suffix === '.png' ) {
      loadPNG();
    }
    else {
      throw new Error( 'unknown image type: ' + filename );
    }

    // Loads / decodes the initial JPEG image, and when done proceeds to the mipmapping
    function loadJPEG() {
      const imageData = jpeg.decode( fs.readFileSync( filename ) );

      mipmaps.push( {
        data: imageData.data,
        width: imageData.width,
        height: imageData.height
      } );

      startMipmapCreation();
    }

    // Loads / decodes the initial PNG image, and when done proceeds to the mipmapping
    function loadPNG() {
      const src = fs.createReadStream( filename );

      const basePNG = new pngjs.PNG( {
        // if we need a specific filter type, put it here
      } );

      basePNG.on( 'error', function( err ) {
        throw err;
      } );

      basePNG.on( 'parsed', function() {
        mipmaps.push( {
          data: basePNG.data,
          width: basePNG.width,
          height: basePNG.height
        } );

        startMipmapCreation();
      } );

      // pass the stream to pngjs
      src.pipe( basePNG );
    }

    /**
     * @param {Buffer} data - Should have 4*width*height elements
     * @param {number} width
     * @param {number} height
     * @param {number} quality - Out of 100
     * @param {function} callback - function( buffer )
     */
    function outputJPEG( data, width, height, quality, callback ) {
      const encodedOuput = jpeg.encode( {
        data: data,
        width: width,
        height: height
      }, quality );
      callback( encodedOuput.data );
    }

    /**
     * @param {Buffer} data - Should have 4*width*height elements
     * @param {number} width
     * @param {number} height
     * @param {function} callback - function( buffer )
     */
    function outputPNG( data, width, height, callback ) {
      // provides width/height so it is initialized with the correct-size buffer
      const png = new pngjs.PNG( {
        width: width,
        height: height
      } );

      // copy our image data into the pngjs.PNG's data buffer;
      data.copy( png.data, 0, 0, data.length );

      // will concatenate the buffers from the stream into one once it is finished
      const buffers = [];
      png.on( 'data', function( buffer ) {
        buffers.push( buffer );
      } );
      png.on( 'end', function() {
        const buffer = Buffer.concat( buffers );

        callback( buffer );
      } );
      png.on( 'error', function( err ) {
        throw err;
      } );

      // kick off the encoding of the PNG
      png.pack();
    }

    // called when our mipmap[0] level is loaded by decoding the main image (creates the mipmap levels)
    function startMipmapCreation() {
      // When reduced to 0, we'll be done with encoding (and can call our callback). Needed because they are asynchronous.
      let encodeCounter = 1;

      // Alpha detection on the level-0 image to see if we can swap jpg for png
      let hasAlpha = false;
      for ( let i = 3; i < mipmaps[ 0 ].data.length; i += 4 ) {
        if ( mipmaps[ 0 ].data[ i ] < 255 ) {
          hasAlpha = true;
          break;
        }
      }

      // called when all of encoding is complete
      function encodingComplete() {
        grunt.log.debug( 'mipmapped ' + filename + ( maxLevel >= 0 ? ' to level ' + maxLevel : '' ) + ' with quality: ' + quality );

        for ( let level = 0; level < mipmaps.length; level++ ) {
          // for now, make .url point to the smallest of the two (unless we have an alpha channel need)
          const usePNG = hasAlpha || mipmaps[ level ].jpgURL.length > mipmaps[ level ].pngURL.length;
          mipmaps[ level ].url = usePNG ? mipmaps[ level ].pngURL : mipmaps[ level ].jpgURL;
          mipmaps[ level ].buffer = usePNG ? mipmaps[ level ].pngBuffer : mipmaps[ level ].jpgBuffer;

          grunt.log.debug( 'level ' + level + ' (' + ( usePNG ? 'PNG' : 'JPG' ) + ' ' +
                           mipmaps[ level ].width + 'x' + mipmaps[ level ].height + ') base64: ' +
                           mipmaps[ level ].url.length + ' bytes ' );
        }

        resolve( mipmaps );
      }

      // kicks off asynchronous encoding for a specific level
      function encodeLevel( level ) {
        encodeCounter++;
        outputPNG( mipmaps[ level ].data, mipmaps[ level ].width, mipmaps[ level ].height, function( buffer ) {
          mipmaps[ level ].pngBuffer = buffer;
          mipmaps[ level ].pngURL = 'data:image/png;base64,' + buffer.toString( 'base64' );
          if ( --encodeCounter === 0 ) {
            encodingComplete();
          }
        } );

        // only encode JPEG if it has no alpha
        if ( !hasAlpha ) {
          encodeCounter++;
          outputJPEG( mipmaps[ level ].data, mipmaps[ level ].width, mipmaps[ level ].height, quality, function( buffer ) {
            mipmaps[ level ].jpgBuffer = buffer;
            mipmaps[ level ].jpgURL = 'data:image/jpeg;base64,' + buffer.toString( 'base64' );
            if ( --encodeCounter === 0 ) {
              encodingComplete();
            }
          } );
        }
      }

      // encode all levels, and compute rasters for levels 1-N
      encodeLevel( 0 );
      function finestMipmap() {
        return mipmaps[ mipmaps.length - 1 ];
      }

      // bail if we already have a 1x1 image, or if we reach the maxLevel (recall maxLevel===-1 means no maximum level)
      while ( ( mipmaps.length - 1 < maxLevel || maxLevel < 0 ) && ( finestMipmap().width > 1 || finestMipmap().height > 1 ) ) {
        const level = mipmaps.length;
        mipmaps.push( mipmapDownscale( finestMipmap(), function( width, height ) {
          return Buffer.alloc( 4 * width * height );
        } ) );
        encodeLevel( level );
      }

      // just in case everything happened synchronously
      if ( --encodeCounter === 0 ) {
        encodingComplete();
      }
    }
  } );
};
