// Copyright 2017, University of Colorado Boulder

/**
 * Creates JavaScript for mipmaps used by the sim.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Chris Malley (PixelZoom, Inc.)
 */

'use strict';

// modules
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const assert = require( 'assert' );
const createMipmap = require( './createMipmap' );

/**
 * Creates the mipmaps requested by the mipmap plugin (sets globals, see chipperGlobals.js and mipmap.js for more info).
 * @public
 *
 * @returns {Promise.<string>} - JS that assigns the mipmaps to window.phet.chipper.mipmaps.
 */
module.exports = async function() {
  // globals that should be defined by this point
  assert( global.phet && global.phet.chipper, 'missing global.phet.chipper' );

  if ( global.phet.chipper.mipmapsToBuild.length === 0 ) {

    // No mipmaps loaded, we're done.
    return '/* no mipmaps */';
  }
  else {
    // Uses Promise.all to wait for all of the sub-promises (using createMipmap) to complete
    const allMipmaps = await Promise.all( global.phet.chipper.mipmapsToBuild.map( async function( { name, path, level, quality } ) {
      const mipmaps = await createMipmap( path, level, quality );
      return {
        name: name,
        // Exclude other objects
        mipmaps: mipmaps.map( ( { width, height, url } ) => { return { width: width, height: height, url: url }; } )
      };
    } ) );

    // Deterministic stringification for https://github.com/phetsims/chipper/issues/419.
    // Possibly use something like https://www.npmjs.com/package/json-stable-stringify in the future?
    const mipmapString = '{' + _.sortBy( allMipmaps, 'name' ).map( ( { name, mipmaps } ) => {
      return '"' + name + '":[' + mipmaps.map( mipmap => {
        return `{width:${mipmap.width},height:${mipmap.height},url:"${mipmap.url}"}`;
      } ).join( ',' ) + ']';
    } ).join( ',' ) + '}';

    return `window.phet.chipper.mipmaps = ${mipmapString};`;
  }
};
