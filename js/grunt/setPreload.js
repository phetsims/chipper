// Copyright 2002-2015, University of Colorado Boulder

/**
 * Determines the set of files to be preloaded before the simulation is run.
 * These files will be loaded via script tags in the generated HTML file.
 * As a side-effect, this modifies pkg.preload.
 * It does not modify the actual package.json file.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

// modules
var assert = require( 'assert' );
var fs = require( 'fs' );

var BUILD_INFO_FILENAME = '../chipper/build.json'; // contains build info, which identifies preloads needed by all sims
var LICENSE_INFO_FILENAME = '../sherpa/third-party-licenses.json'; // contains third-party license info

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
  grunt.log.writeln( 'Adding common preload files...' );
  assert( buildInfo.common && buildInfo.common.preload, BUILD_INFO_FILENAME + ' is missing common.preload' );
  var preload = buildInfo.common.preload;

  // Add sim-specific preloads, as specified in the (optional) preload field of package.json.
  if ( pkg.preload ) {
    grunt.log.writeln( 'Adding sim-specific preload files...' );
    preload = preload.concat( pkg.preload );
  }

  // Add together (data collection) preloads, as specified in build.json
  if ( grunt.option( 'together' ) ) {
    grunt.log.writeln( 'Adding together preload files...' );
    assert( buildInfo.together && buildInfo.together.preload, BUILD_INFO_FILENAME + ' is missing together.preload' );
    preload = preload.concat( buildInfo.together.preload );
    assert( pkg.name, 'package.json is missing name' );
    preload.push( '../together/js/api/' + pkg.name + '-api.js' );
  }

  // Modify pkg
  pkg.preload = preload;
  grunt.log.writeln( 'pkg.preload = ' + pkg.preload.toString() );
};
