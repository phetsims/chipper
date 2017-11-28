// Copyright 2017, University of Colorado Boulder

/**
 * Gets the license keys for sherpa (third-party) libs that are used.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const getPreloads = require( './getPreloads' );

/**
 * Gets the license keys for sherpa (third-party) libs that are used.
 *
 * @param {Object} grunt
 * @param {string} repo
 * @param {string} brand
 * @returns {Array.<string>}
 */
module.exports = function( grunt, repo, brand ) {
  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );
  var buildObject;
  try {
    buildObject = grunt.file.readJSON( '../chipper/build.json' );
  } 
  catch ( e ) {
    buildObject = {};
  }
  const preload = getPreloads( grunt, repo, brand );

  // start with package.json
  var licenseKeys = packageObject.phet.licenseKeys || [];

  // add common and brand-specific entries from build.json
  [ 'common', brand ].forEach( id => {
    if ( buildObject[ id ] && buildObject[ id ].licenseKeys ) {
      licenseKeys = licenseKeys.concat( buildObject[ id ].licenseKeys );
    }
  } );

  // Extract keys from preload for sherpa (third-party) dependencies
  preload.forEach( path => {
    if ( path.indexOf( '/sherpa/' ) !== -1 ) {
      var lastSlash = path.lastIndexOf( '/' );
      var key = path.substring( lastSlash + 1 );
      licenseKeys.push( key );
    }
  } );

  // sort and remove duplicates
  return _.uniq( _.sortBy( licenseKeys, key => key.toUpperCase() ) );
};
