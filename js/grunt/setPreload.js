// Copyright 2002-2015, University of Colorado Boulder

/**
 * Determines the set of files to be preloaded before the simulation is run.
 * These files will be loaded via script tags in the generated HTML file.
 * As a side-effect, this modifies pkg.preload.
 * It does not modify the actual package.json file.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

var assert = require( 'assert' );

/*
 * @param grunt the grunt instance
 * @param {string} repositoryName name of the sim's repository
 * @param {Object} pkg package.json
 */
module.exports = function( grunt, pkg ) {
  'use strict';

  assert( pkg.name, 'name required in package.json' );

  // Put common preloads first. All sims have these.
  console.log( 'Adding common preload files...' );
  var preload = [

    // 3rd-party scripts
    "../sherpa/jquery-2.1.0.js",
    "../sherpa/lodash-2.4.1.js",
    "../sherpa/has.js",
    "../sherpa/FileSaver.js",

    // PhET scripts
    "../assert/js/assert.js",
    "../chipper/js/initialize-globals.js",
    "../phetcommon/js/analytics/google-analytics.js"
  ];

  // Then add sim-specific preloads, as specified in the (optional) preload field of package.json.
  if ( pkg.preload ) {
    console.log( 'Adding sim-specific preload files...' );
    preload = preload.concat( pkg.preload );
  }

  // Finally, add additional preloads required by together (data collection).
  if ( grunt.option( 'together' ) ) {
    console.log( 'Adding together preload files...' );
    preload = preload.concat( [
      '../sherpa/jsondiffpatch-0.1.31.js',
      '../together/js/together.js',
      '../together/js/SimIFrameAPI.js',
      '../together/js/togetherEvents.js',
      '../together/js/datamite.js',
      '../together/js/api/TogetherCommon.js',
      '../together/js/api/' + pkg.name + '-api.js'
    ] );
  }

  // Modify pkg
  pkg.preload = preload;
  console.log( 'pkg.preload = ' + pkg.preload.toString() );
};
