// Copyright 2013-2015, University of Colorado Boulder

/**
 * Grunt configuration file for PhET projects.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

const buildRunnable = require( './buildRunnable' );
const buildStandalone = require( './buildStandalone' );
const chipperGlobals = require( './chipperGlobals' );
const fs = require( 'fs' );
const getPhetLibs = require( './getPhetLibs' );
const lint = require( './lint' );

module.exports = function( grunt ) {
  var brand = 'phet'; // TODO: don't hardcode! we'll need to rewrite some things that reference this

  var packageObject = grunt.file.readJSON( 'package.json' );

  chipperGlobals.initialize( grunt );

  grunt.registerTask( 'default', 'Builds the repository', ( grunt.option( 'lint' ) === false ? [] : [ 'lint-all' ] ).concat( [ 'clean', 'build' ] ) );

  grunt.registerTask( 'clean',
    'Erases the build/ directory and all its contents, and recreates the build/ directory',
    function() {
      if ( grunt.file.exists( 'build' ) ) {
        grunt.file.delete( 'build' );
      }
      grunt.file.mkdir( 'build' );
    } );

  grunt.registerTask( 'build',
    'TODO',
    async function() {
      const done = grunt.task.current.async();

      const uglify = grunt.option( 'uglify' ) !== false;
      const mangle = grunt.option( 'mangle' ) !== false;
      const name = grunt.file.readJSON( 'package.json' ).name;

      try {
        if ( name === 'scenery' || name === 'kite' || name === 'dot' ) {
          fs.writeFileSync( 'build/' + name + '.min.js', await buildStandalone( grunt, uglify, mangle ) );
        }
        else {
          await buildRunnable( grunt, uglify, mangle, 'phet' ); // TODO: other brands
        }
      }
      catch ( e ) {
        console.log( e );
        grunt.log.error( e );
      }

      done();
    }
  );

  grunt.registerTask( 'lint', 'lint js files that are specific to this repository', function() {
    lint( grunt, [ packageObject.name ] );
  } );

  grunt.registerTask( 'lint-all', 'lint all js files that are required to build this repository', async function() {
    const done = grunt.task.current.async();

    lint( grunt, getPhetLibs( grunt, packageObject.name, brand ) );

    done();
  } );

  grunt.registerTask( 'lint-everything', 'lint all js files that are required to build this repository', function() {
    lint( grunt, grunt.file.read( '../chipper/data/active-repos' ).trim().split( /\r?\n/ ) );
  } );
};
