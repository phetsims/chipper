// Copyright 2017-2024, University of Colorado Boulder

/**
 * This grunt task generates 128x84 and 600x394 thumbnails of the sim's screenshot in assets.
 * Thumbnails are put in the build directory of the sim. If the directory doesn't exist, it is created.
 * New grunt tasks can easily be created to generate different sized images by passing this function
 * different heights and widths.
 *
 * @author Aaron Davis
 */

import jimp from 'jimp';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';

/**
 * @param repo - name of the repository
 * @param width of the resized image
 * @param height of the resized image
 * @param quality - percent quality, in the range [0..100]
 * @param mime - Mime type - one of jimp.MIME_PNG, jimp.MIME_JPEG, jimp.MIME_BMP
 * @param altSuffix - ending for the filename e.g. -alt1
 * @returns Resolves to a {Buffer} with the image data
 */
export default function generateThumbnails( repo: string, width: number, height: number, quality: number, mime: string, altSuffix: string | undefined = undefined ): Promise<Buffer> {
  return new Promise( ( resolve, reject ) => {
    const fullResImageName = `../${repo}/assets/${repo}-screenshot${altSuffix || ''}.png`;

    if ( !grunt.file.exists( fullResImageName ) ) {
      grunt.log.writeln( `no image file exists: ${fullResImageName}. Aborting generateThumbnails` );
      return;
    }

    new jimp( fullResImageName, function( this: IntentionalAny ) { // eslint-disable-line no-new
      if ( mime === jimp.MIME_JPEG ) {
        this.quality( quality );
      }
      this.resize( width, height ).getBuffer( mime, ( error: string, buffer: Buffer ) => {
        if ( error ) {
          reject( new Error( error ) );
        }
        else {
          resolve( buffer );
        }
      } );
    } );
  } );
}