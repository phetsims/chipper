// Copyright 2015, University of Colorado Boulder

/**
 * Full PhET-iO build including phet version, phet-io version and accompanying material.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// modules
var assert = require( 'assert' );
var copyDirectory = require( '../../../chipper/js/grunt/copyDirectory' );
var child_process = require( 'child_process' );
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

/**
 * @param grunt the grunt instance
 * @param {Object} buildConfig
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  var cwd = process.cwd();

  var phetioBuildDir = cwd + '/build-phet-io';
  var buildDir = cwd + '/build';

  // Clean
  if ( grunt.file.exists( phetioBuildDir ) ) {
    grunt.file.delete( phetioBuildDir );
  }
  grunt.file.mkdir( phetioBuildDir );

  var createOtherPhETIOFiles = function() {

    // create devguide/
    grunt.file.mkdir( 'build/phet-io/devguide' );
    copyDirectory( grunt, '../phet-io/doc/devguide', 'build/phet-io/devguide' );

    // create protected/
    grunt.file.mkdir( 'build/phet-io/protected' );
    grunt.file.mkdir( 'build/phet-io/protected/lib' );
    grunt.file.mkdir( 'build/phet-io/protected/api' );
    grunt.file.mkdir( 'build/phet-io/protected/wrappers' );

    copyDirectory( grunt, '../phet-io/html/wrappers', 'build/phet-io/protected/wrappers' );

    var wrapperHTML = grunt.file.read( '../phet-io/templates/wrappers.html' );
    wrapperHTML = ChipperStringUtils.replaceAll( wrapperHTML, '$SIM$', buildConfig.name );
    wrapperHTML = ChipperStringUtils.replaceAll( wrapperHTML, '$VERSION$', buildConfig.version );
    wrapperHTML = ChipperStringUtils.replaceAll( wrapperHTML, '$PHET_IO_HTML_SIM_FILENAME$', buildConfig.name + '_en-phetio.html' );
    console.log( wrapperHTML );
    grunt.file.write( 'build/phet-io/protected/wrappers.html', wrapperHTML );

    // TODO: chipper#101 eek, this is scary! we are importing from the repository dir. ideally we should just have uglify-js installed once in chipper?
    var uglify = require( '../../../' + buildConfig.name + '/node_modules/uglify-js' );

    var destinationPath = 'build/phet-io/protected/lib';

    var minifyAndWrite = function( filename, precode ) {
      var minified = uglify.minify( [ '../phet-io/js/' + filename ], {
        mangle: true,
        output: {
          inline_script: true, // escape </script
          beautify: false
        },
        compress: {
          global_defs: {}
        }
      } ).code;

      var copyrightHeader = '// Copyright 2002-2016, University of Colorado Boulder\n' +
                            '// This PhET-iO file requires a license\n' +
                            '// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' +
                            '// For licensing, please contact phethelp@colorado.edu';
      grunt.file.write( destinationPath + '/' + filename, copyrightHeader + '\n\n' + precode + minified );
    };

    minifyAndWrite( 'SimIFrameClient.js', '' );

    // Determine which sim versions will be pointed to by SimWrapperUtils
    minifyAndWrite( 'SimWrapperUtils.js', 'window.useRelativeSimPath=true;' );
  };

  if ( grunt.option( 'skipBuild' ) ) {
    grunt.file.mkdir( 'build/phet-io' );
    createOtherPhETIOFiles();
  }
  else {
    var done = grunt.task.current.async();
    var command1 = 'grunt --brand=phet-io';
    var command2 = 'grunt --brand=phet';
    grunt.log.writeln( 'Starting command: ' + command1 + '...' );
    child_process.exec( command1, { cwd: cwd }, function( error1, stdout1, stderr1 ) {
      assert( !error1, 'error in ' + command1 + '\n' + error1 );
      grunt.log.writeln( 'Finished command: ' + command1 );
      grunt.log.writeln( stdout1 );
      grunt.log.writeln( stderr1 );
      copyDirectory( grunt, buildDir, phetioBuildDir );

      grunt.log.writeln( 'Starting command: ' + command2 + '...' );
      child_process.exec( command2, { cwd: cwd }, function( error2, stdout2, stderr2 ) {
        assert( !error2, 'error in ' + command2 + '\n' + error2 );
        grunt.log.writeln( 'Finished command: ' + command2 );
        grunt.log.writeln( stdout2 );
        grunt.log.writeln( stderr2 );
        copyDirectory( grunt, phetioBuildDir, buildDir + '/phet-io' );

        createOtherPhETIOFiles();
        done();
      } );
    } );
  }
};