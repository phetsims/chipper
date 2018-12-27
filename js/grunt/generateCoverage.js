// Copyright 2016, University of Colorado Boulder

/**
 * Generates build/coverage-report/ which contains a code coverage report based on the file
 * build/instrumentation/coverage.json
 *
 * To generate coverage for a sim (or other codebase):
 * 1. Build with instrumentation added (preferably without minification):
 *    $ grunt --uglify=false --instrument=true
 * 2. Run the instrumented version from the build directory.
 * 3. When done, in the JS console, `copy( __coverage__ )` to copy JSON coverage information into your clipboard.
 * 4. Paste it into build/instrumentation/coverage.json
 * 5. Run coverage generation:
 *    $ grunt generate-coverage
 * 6. Browse coverage at build/coverage-report/lcov-report/ (has an index.html)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// modules
const grunt = require( 'grunt' );
const istanbul = require( 'istanbul' );

/**
 * @param {string} repo
 */
module.exports = function( repo ) {

  const collector = new istanbul.Collector();
  collector.add( JSON.parse( grunt.file.read( `../${repo}/build/instrumentation/coverage.json` ) ) );

  grunt.file.mkdir( `../${repo}/build/coverage-report` );

  const report = istanbul.Report.create( 'lcov', {
    dir: `../${repo}/build/coverage-report`
  } );
  report.writeReport( collector, true );
};
