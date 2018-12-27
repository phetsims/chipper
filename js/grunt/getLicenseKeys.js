// Copyright 2017, University of Colorado Boulder

/**
 * Gets the license keys for sherpa (third-party) libs that are used.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const getPreloads = require( './getPreloads' );
const grunt = require( 'grunt' );

/**
 * Gets the license keys for sherpa (third-party) libs that are used.
 *
 * @param {string} repo
 * @param {string} brand
 * @returns {Array.<string>}
 */
module.exports = function( repo, brand ) {
  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );
  let buildObject;
  try {
    buildObject = grunt.file.readJSON( '../chipper/build.json' );
  }
  catch( e ) {
    buildObject = {};
  }
  const preload = getPreloads( repo, brand );

  // start with package.json
  let licenseKeys = packageObject.phet.licenseKeys || [];

  // add common and brand-specific entries from build.json
  [ 'common', brand ].forEach( id => {
    if ( buildObject[ id ] && buildObject[ id ].licenseKeys ) {
      licenseKeys = licenseKeys.concat( buildObject[ id ].licenseKeys );
    }
  } );

  // Extract keys from preload for sherpa (third-party) dependencies
  preload.forEach( path => {
    if ( path.indexOf( '/sherpa/' ) !== -1 ) {
      const lastSlash = path.lastIndexOf( '/' );
      const key = path.substring( lastSlash + 1 );
      licenseKeys.push( key );
    }
  } );

  // sort and remove duplicates
  return _.uniq( _.sortBy( licenseKeys, key => key.toUpperCase() ) );
};
