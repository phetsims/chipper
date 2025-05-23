// Copyright 2017-2025, University of Colorado Boulder

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
 * @param filename
 * @param maxLevel - An integer denoting the maximum level of detail that should be included, or -1 to include
 *                            all levels up to and including a 1x1 image.
 * @param quality - An integer from 1-100 determining the quality of the image. Currently only used for the
 *                           JPEG encoding quality.
 * @returns - Will be resolved with mipmaps: {Array} (consisting of the mipmap objects, mipmaps[0] will be level 0)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */


import fs from 'fs';
import mipmapDownscale from '../../../chipper/js/common/mipmapDownscale.js';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';

const jpegJs = require( 'jpeg-js' );
const pngjs = require( 'pngjs' );

type TMipmap = {
  width: number;
  height: number;
  data: Buffer;
  url?: string;
  buffer?: Buffer;
  pngURL?: string;
  pngBuffer?: Buffer;
  jpgURL?: string;
  jpgBuffer?: Buffer;
};

export default function createMipmap( filename: string, maxLevel: number, quality: number ): Promise<TMipmap[]> {
  return new Promise( ( resolve, reject ) => {
    const mipmaps: TMipmap[] = [];

    // kick everything off
    const suffix = filename.slice( -4 );
    if ( suffix === '.jpg' ) {
      loadJPEG();
    }
    else if ( suffix === '.png' ) {
      loadPNG();
    }
    else {
      reject( new Error( `unknown image type: ${filename}` ) );
    }

    // Loads / decodes the initial JPEG image, and when done proceeds to the mipmapping
    function loadJPEG(): void {
      const imageData = jpegJs.decode( fs.readFileSync( filename ) );

      mipmaps.push( {
        data: imageData.data,
        width: imageData.width,
        height: imageData.height
      } );

      startMipmapCreation();
    }

    // Loads / decodes the initial PNG image, and when done proceeds to the mipmapping
    function loadPNG(): void {
      const src = fs.createReadStream( filename );

      const basePNG = new pngjs.PNG( {
        // if we need a specific filter type, put it here
      } );

      basePNG.on( 'error', ( err: Error ) => {
        reject( err );
      } );

      basePNG.on( 'parsed', () => {
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
     * @param data - Should have 4*width*height elements
     * @param width
     * @param height
     * @param quality - Out of 100
     * @param callback - function( buffer )
     */
    function outputJPEG( data: Buffer, width: number, height: number, quality: number, callback: ( buffer: Buffer ) => void ): void {
      const encodedOuput = jpegJs.encode( {
        data: data,
        width: width,
        height: height
      }, quality );
      callback( encodedOuput.data );
    }

    /**
     * @param data - Should have 4*width*height elements
     * @param width
     * @param height
     * @param callback - function( buffer )
     */
    function outputPNG( data: Buffer, width: number, height: number, callback: ( buffer: Buffer ) => void ): void {
      // provides width/height so it is initialized with the correct-size buffer
      const png = new pngjs.PNG( {
        width: width,
        height: height
      } );

      // copy our image data into the pngjs.PNG's data buffer;
      data.copy( png.data, 0, 0, data.length );

      // will concatenate the buffers from the stream into one once it is finished
      const buffers: Buffer[] = [];
      png.on( 'data', ( buffer: Buffer ) => {
        buffers.push( buffer );
      } );
      png.on( 'end', () => {
        const buffer = Buffer.concat( buffers );

        callback( buffer );
      } );
      png.on( 'error', ( err: Error ) => {
        reject( err );
      } );

      // kick off the encoding of the PNG
      png.pack();
    }

    // called when our mipmap[0] level is loaded by decoding the main image (creates the mipmap levels)
    function startMipmapCreation(): void {
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

      // called when all encoding is complete
      function encodingComplete(): void {

        grunt.log.verbose.writeln( `mipmapped ${filename}${maxLevel >= 0 ? ` to level ${maxLevel}` : ''} with quality: ${quality}` );

        for ( let level = 0; level < mipmaps.length; level++ ) {

          // for now, make .url point to the smallest of the two (unless we have an alpha channel need)
          const usePNG = hasAlpha || mipmaps[ level ].jpgURL!.length > mipmaps[ level ].pngURL!.length;
          mipmaps[ level ].url = usePNG ? mipmaps[ level ].pngURL : mipmaps[ level ].jpgURL;
          mipmaps[ level ].buffer = usePNG ? mipmaps[ level ].pngBuffer : mipmaps[ level ].jpgBuffer;

          grunt.log.verbose.writeln( `level ${level} (${usePNG ? 'PNG' : 'JPG'} ${
            mipmaps[ level ].width}x${mipmaps[ level ].height}) base64: ${
            mipmaps[ level ].url!.length} bytes ` );
        }

        resolve( mipmaps );
      }

      // kicks off asynchronous encoding for a specific level
      function encodeLevel( level: number ): void {
        encodeCounter++;
        outputPNG( mipmaps[ level ].data, mipmaps[ level ].width, mipmaps[ level ].height, buffer => {
          mipmaps[ level ].pngBuffer = buffer;
          mipmaps[ level ].pngURL = `data:image/png;base64,${buffer.toString( 'base64' )}`;
          if ( --encodeCounter === 0 ) {
            encodingComplete();
          }
        } );

        // only encode JPEG if it has no alpha
        if ( !hasAlpha ) {
          encodeCounter++;
          outputJPEG( mipmaps[ level ].data, mipmaps[ level ].width, mipmaps[ level ].height, quality, buffer => {
            mipmaps[ level ].jpgBuffer = buffer;
            mipmaps[ level ].jpgURL = `data:image/jpeg;base64,${buffer.toString( 'base64' )}`;
            if ( --encodeCounter === 0 ) {
              encodingComplete();
            }
          } );
        }
      }

      // encode all levels, and compute rasters for levels 1-N
      encodeLevel( 0 );

      function finestMipmap(): TMipmap {
        return mipmaps[ mipmaps.length - 1 ];
      }

      // bail if we already have a 1x1 image, or if we reach the maxLevel (recall maxLevel===-1 means no maximum level)
      // eslint-disable-next-line no-unmodified-loop-condition
      while ( ( mipmaps.length - 1 < maxLevel || maxLevel < 0 ) && ( finestMipmap().width > 1 || finestMipmap().height > 1 ) ) {
        const level = mipmaps.length;
        mipmaps.push( mipmapDownscale( finestMipmap(), ( width: number, height: number ) => {
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
}