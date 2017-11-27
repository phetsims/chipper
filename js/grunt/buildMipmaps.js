// Copyright 2017, University of Colorado Boulder

/**
 * Creates JavaScript for mipmaps used by the sim.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Chris Malley (PixelZoom, Inc.)
 */
/* eslint-env node */
'use strict';

// modules
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const assert = require( 'assert' );
const createMipmap = require( './createMipmap' );

// Grabs the mipmaps from a global
// TODO: Don't do it this way! OMG?
module.exports = async function( grunt ) {
  // globals that should be defined by this point
  assert( global.phet && global.phet.chipper, 'missing global.phet.chipper' );

  if ( global.phet.chipper.mipmapsToBuild.length === 0 ) {

    // No mipmaps loaded, we're done.
    return '<!-- no mipmaps -->';
  }
  else {
    const allMipmaps = await Promise.all( global.phet.chipper.mipmapToBuild.map( async function( { name, path, level, quality } ) {
      const mipmaps = await createMipmap( grunt, path, level, quality );
      return {
        name,
        // Exclude other objects
        mipmaps: mipmaps.map( ( { width, height, url } ) => { return { width, height, url }; } )
      };
    } ) );

    // Deterministic stringification for https://github.com/phetsims/chipper/issues/419.
    // Possibly use something like https://www.npmjs.com/package/json-stable-stringify in the future?
    const mipmapString = '{' + _.sortBy( allMipmaps, 'name' ).map( ( { name, mipmaps } ) => {
      return '"' + name + '":[' + mipmaps.map( mipmap => {
        return '{width:' + mipmap.width + ',height:' + mipmap.height + ',url:"' + mipmap.url + '"}';
      } ).join( ',' ) + ']';
    } ).join( ',' ) + '}';

    return 'window.phet.chipper.mipmaps = ' + mipmapString + ';';
  }
};
