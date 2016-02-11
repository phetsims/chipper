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

  var skipBuild = grunt.option( 'skipBuild' );
  var packageJSON = grunt.file.readJSON( 'package.json' );

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
    copyDirectory( grunt, '../sherpa/lib/highlight.js-9.1.0', 'build/phet-io/devguide/lib/highlight.js-9.1.0' );
    copyDirectory( grunt, '../phet-io/doc/devguide', 'build/phet-io/devguide', function( abspath, contents ) {
      if ( abspath.indexOf( '.html' ) >= 0 ) {
        return ChipperStringUtils.replaceAll( contents, '../../../sherpa/lib/highlight.js-9.1.0', 'lib/highlight.js-9.1.0' );
      }
    } );

    // create protected/
    grunt.file.mkdir( 'build/phet-io/protected' );
    grunt.file.mkdir( 'build/phet-io/protected/lib' );
    grunt.file.mkdir( 'build/phet-io/protected/api' );
    grunt.file.mkdir( 'build/phet-io/protected/wrappers' );

    var filterWrapper = function( abspath, contents ) {
      if ( abspath.indexOf( '.html' ) >= 0 ) {
        return ChipperStringUtils.replaceAll( contents, '../../js/', '../lib/' );
      }
    };
    copyDirectory( grunt, '../phet-io/html/wrappers', 'build/phet-io/protected/wrappers', filterWrapper );

    // TODO: what is something overwrites? These directories are being merged.
    var simSpecificPath = '../phet-io/html/' + buildConfig.name;
    if ( grunt.file.exists( simSpecificPath ) ) {
      var failOnExistingFiles = true;
      if ( skipBuild ) {
        failOnExistingFiles = false;
      }
      copyDirectory( grunt, simSpecificPath, 'build/phet-io/protected/wrappers', filterWrapper, { failOnExistingFiles: failOnExistingFiles } );
    }

    // Copy the API files
    var preload = packageJSON.phet[ 'phet-io' ].preload;
    for ( var i = 0; i < preload.length; i++ ) {
      var lastSlash = preload[ i ].lastIndexOf( '/' );
      var filename = preload[ i ].substring( lastSlash + 1 );
      grunt.file.copy( preload[ i ], 'build/phet-io/protected/api/' + filename );
    }

    // The .htaccess file
    grunt.file.copy( '../phet-io/templates/.htaccess', 'build/phet-io/protected/.htaccess' );

    var wrapperHTML = grunt.file.read( '../phet-io/templates/wrappers.html' );
    wrapperHTML = ChipperStringUtils.replaceAll( wrapperHTML, '$SIM$', buildConfig.name );
    wrapperHTML = ChipperStringUtils.replaceAll( wrapperHTML, '$VERSION$', buildConfig.version );
    wrapperHTML = ChipperStringUtils.replaceAll( wrapperHTML, '$PHET_IO_HTML_SIM_FILENAME$', buildConfig.name + '_en-phetio.html' );
    wrapperHTML = ChipperStringUtils.replaceAll( wrapperHTML, '$SIM_NAME$', buildConfig.name );
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

  if ( skipBuild ) {
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
      grunt.log.writeln( stdout1 );
      grunt.log.writeln( stderr1 );
      grunt.log.writeln( 'Finished command: ' + command1 );
      copyDirectory( grunt, buildDir, phetioBuildDir );

      grunt.log.writeln( 'Starting command: ' + command2 + '...' );
      child_process.exec( command2, { cwd: cwd }, function( error2, stdout2, stderr2 ) {
        assert( !error2, 'error in ' + command2 + '\n' + error2 );
        grunt.log.writeln( stdout2 );
        grunt.log.writeln( stderr2 );
        grunt.log.writeln( 'Finished command: ' + command2 );
        copyDirectory( grunt, phetioBuildDir, buildDir + '/phet-io' );

        createOtherPhETIOFiles();
        done();
      } );
    } );
  }
};