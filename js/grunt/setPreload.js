// Copyright 2002-2015, University of Colorado Boulder

/**
 * Determines the set of files to be preloaded before the simulation is run.
 * These files will be loaded via script tags in the generated HTML file.
 * As a side-effect, this modifies pkg.phet.preload.
 * It does not modify the actual package.json file.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

// modules
var assert = require( 'assert' );
var fs = require( 'fs' );

var BUILD_INFO_FILENAME = '../chipper/build.json'; // contains build info, which identifies preloads needed by all sims
var LICENSE_INFO_FILENAME = '../sherpa/lib/license.json'; // contains third-party license info

/*
 * @param grunt the grunt instance
 * @param {string} repositoryName name of the sim's repository
 * @param {Object} pkg package.json
 */
module.exports = function( grunt, pkg ) {
  'use strict';

  // Read build info
  assert( fs.existsSync( BUILD_INFO_FILENAME ), 'missing ' + BUILD_INFO_FILENAME );
  var buildInfo = grunt.file.readJSON( BUILD_INFO_FILENAME );

  // Read license info
  assert( fs.existsSync( LICENSE_INFO_FILENAME ), 'missing ' + LICENSE_INFO_FILENAME );

  // Add common preloads, as specified in build.json
  grunt.log.debug( 'Adding common preload files...' );
  assert( buildInfo.common && buildInfo.common.preload, BUILD_INFO_FILENAME + ' is missing common.preload' );
  var preload = buildInfo.common.preload;

  // Add sim-specific preloads, as specified in the (optional) preload field of package.json.
  if ( pkg.phet.preload ) {
    grunt.log.debug( 'Adding sim-specific preload files...' );
    preload = preload.concat( pkg.phet.preload );
  }

  // Add phet-io preloads, as specified in build.json
  if ( global.phet.chipper.brand === 'phet-io' ) {
    grunt.log.debug( 'Adding phet-io preload files...' );
    assert( buildInfo[ 'phet-io' ] && buildInfo[ 'phet-io' ].preload, BUILD_INFO_FILENAME + ' is missing phet-io.preload' );
    preload = preload.concat( buildInfo[ 'phet-io' ].preload );
    assert( pkg.name, 'package.json is missing name' );
    var togetherAPI = '../together/js/api/' + pkg.name + '-api.js';
    assert( fs.existsSync( togetherAPI ), 'together API file does not exist: ' + togetherAPI );
    preload.push( togetherAPI );
  }

  // Modify pkg
  pkg.phet.preload = preload;
  grunt.log.debug( 'pkg.phet.preload = ' + pkg.phet.preload.toString() );
};
