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
/* eslint-env node */
'use strict';

// modules
var istanbul = require( 'istanbul' );

/**
 * @param {Object} grunt - The grunt runtime object
 * @param {Object} buildConfig - see getBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {

  var collector = new istanbul.Collector();
  collector.add( JSON.parse( grunt.file.read( 'build/instrumentation/coverage.json' ) ) );

  grunt.file.mkdir( 'build/coverage-report' );

  var report = istanbul.Report.create( 'lcov', {
    dir: 'build/coverage-report'
  } );
  report.writeReport( collector, true );
};
