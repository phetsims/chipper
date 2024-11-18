// Copyright 2013-2024, University of Colorado Boulder

/**
 * Converts a resource (like an image or sound file) to base64.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
import fs from 'fs';

const MIME_TYPES = {
  png: 'image/png',
  svg: 'image/svg+xml',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  cur: 'image/x-icon', // cursor files (used in build-a-molecule). x-win-bitmap gives off warnings in Chrome
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  bma: 'audio/webm', // webma is the full extension
  wav: 'audio/wav',
  woff: 'application/x-font-woff'
};

/**
 * @returns - A base-64 Data URI for the given resource
 */
function loadFileAsDataURI( filename: string ): string {
  const filenameParts = filename.split( '.' );
  const suffix = filenameParts[ filenameParts.length - 1 ] as keyof typeof MIME_TYPES;

  const mimeType = MIME_TYPES[ suffix ];

  if ( !mimeType ) {
    throw new Error( `Unknown mime type for filename: ${filename}` );
  }

  const base64 = `data:${mimeType};base64,${Buffer.from( fs.readFileSync( filename ) ).toString( 'base64' )}`;
  return base64;
}

export default loadFileAsDataURI;