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

  // TODO: chipper#101 eek, this is scary! we are importing from the repository dir. ideally we should just have uglify-js installed once in chipper?
  var uglify = require( '../../../' + buildConfig.name + '/node_modules/uglify-js' );

  var skipBuild = grunt.option( 'skipBuild' );

  var cwd = process.cwd();

  var phetioBuildDir = cwd + '/build-phet-io';
  var buildDir = cwd + '/build';

  // Clean
  grunt.file.exists( phetioBuildDir ) && grunt.file.delete( phetioBuildDir );
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

    // output the SimIFrameClient.js and PhETIOAppUtils.js to the top level lib (not protected), see https://github.com/phetsims/phet-io/issues/353
    grunt.file.mkdir( 'build/phet-io/lib' );

    // create protected/
    grunt.file.mkdir( 'build/phet-io/protected' );

    // Load the template for instance-proxies.html
    var templateText = grunt.file.read( '../phet-io/html/templates/load-state.html' );
    var lines = templateText.split( '\n' );
    var templateString = '[';
    lines.forEach( function( line ) {
      templateString = templateString + '\'' + line + '\',\n';
    } );
    // "<script>" does not parse in an HTML file (even if in JS), so we split it apart into separate substrings.
    templateString = ChipperStringUtils.replaceAll( templateString, '<script>', '<scr\'+\'ipt>' );
    templateString = ChipperStringUtils.replaceAll( templateString, '</script>', '</scr\'+\'ipt>' );
    templateString = templateString + '\'\'].join(\'\\n\')';

    var filterWrapper = function( abspath, contents ) {
      var originalContents = contents + '';
      if ( abspath.indexOf( '.js' ) >= 0 || abspath.indexOf( '.html' ) >= 0 ) {
        contents = ChipperStringUtils.replaceAll( contents, '$SIMULATION_NAME$', buildConfig.name );
        contents = ChipperStringUtils.replaceAll( contents, '$SIMULATION_VERSION$', buildConfig.version );
      }
      if ( abspath.indexOf( '.html' ) >= 0 ) {

        contents = ChipperStringUtils.replaceAll( contents,
          '"../../../sherpa/lib/lodash-2.4.1.min.js"',
          '"https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.11.2/lodash.min.js"'
        );
        contents = ChipperStringUtils.replaceAll( contents,
          '"../../../sherpa/lib/font-awesome-4.5.0/css/font-awesome.min.css"',
          '"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.5.0/css/font-awesome.min.css"'
        );
        contents = ChipperStringUtils.replaceAll( contents,
          '"../../../sherpa/lib/jquery-2.1.0.min.js"',
          '"https://code.jquery.com/jquery-2.2.3.min.js"'
        );
        contents = ChipperStringUtils.replaceAll( contents,
          '../../../sherpa/lib/jquery-ui-1.8.24.min.js"',
          '"https://code.jquery.com/ui/1.8.24/jquery-ui.min.js"'
        );
        contents = ChipperStringUtils.replaceAll( contents,
          '"../../../sherpa/lib/d3-4.2.2.js"',
          '"https://cdnjs.cloudflare.com/ajax/libs/d3/4.2.2/d3.min.js"'
        );
        contents = ChipperStringUtils.replaceAll( contents,
          '"../../../query-string-machine/js/QueryStringMachine.js"',
          '"../../../lib/QueryStringMachine.js"'
        );
        contents = ChipperStringUtils.replaceAll( contents,
          '<script type="text/javascript" src="../../../assert/js/assert.js"></script>',
          '<script>' + grunt.file.read( '../assert/js/assert.js' ) + '</script>'
        );
        contents = ChipperStringUtils.replaceAll( contents,
          'var isBuiltMode = false;',
          'var isBuiltMode = true;' );
        contents = ChipperStringUtils.replaceAll( contents,
          'var templateText = null;',
          'var templateText = ' + templateString + ';'
        ); //template uses exclusively "

        contents = ChipperStringUtils.replaceAll( contents, '../../js/', '../../lib/' );
      }
      if ( contents !== originalContents ) {
        return contents;
      } else {
        return null; // signify no change (helps for images)
      }
    };
    copyDirectory( grunt, '../phet-io/wrappers', 'build/phet-io/protected/wrappers', filterWrapper );

    // TODO: what if something overwrites? These directories are being merged.
    var simSpecificPath = '../phet-io/html/' + buildConfig.name;
    if ( grunt.file.exists( simSpecificPath ) ) {
      var failOnExistingFiles = true;
      if ( skipBuild ) {
        failOnExistingFiles = false;
      }
      copyDirectory( grunt, simSpecificPath, 'build/phet-io/protected/wrappers', filterWrapper, { failOnExistingFiles: failOnExistingFiles } );
    }

    // The .htaccess file
    grunt.file.copy( '../phet-io/templates/.htaccess', 'build/phet-io/protected/.htaccess' );

    var wrapperHTML = grunt.file.read( '../phet-io/templates/app-index.html' );
    wrapperHTML = ChipperStringUtils.replaceAll( wrapperHTML, '$SIM$', buildConfig.name );
    wrapperHTML = ChipperStringUtils.replaceAll( wrapperHTML, '$VERSION$', buildConfig.version );
    wrapperHTML = ChipperStringUtils.replaceAll( wrapperHTML, '$PHET_IO_HTML_SIM_FILENAME$', buildConfig.name + '_en-phetio.html' );
    wrapperHTML = ChipperStringUtils.replaceAll( wrapperHTML, '$SIM_NAME$', buildConfig.name );
    grunt.file.write( 'build/phet-io/protected/index.html', wrapperHTML );

    var destinationPath = 'build/phet-io/lib';

    /**
     * @param  {string} path - relative path to file
     * @param  {string} copyright - text containing copyright information
     * @param  {string} precode - additional text to be prepended to file
     */
    var minifyAndWrite = function( path, copyright, precode ) {
      var fileName = path.split( '/' ).pop();
      var minified = uglify.minify( [ path ], {
        mangle: true,
        output: {
          inline_script: true, // escape </script
          beautify: false
        },
        compress: {
          global_defs: {}
        }
      } ).code;

      grunt.file.write( destinationPath + '/' + fileName, copyright + '\n\n' + precode + minified );
    };

    var copyrightHeader = '// Copyright 2002-2016, University of Colorado Boulder\n' +
      '// This PhET-iO file requires a license\n' +
      '// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' +
      '// For licensing, please contact phethelp@colorado.edu';

    minifyAndWrite( '../phet-io/wrappers/common/js/SimIFrameClient.js', copyrightHeader, '' );

    // Determine which sim versions will be pointed to by PhETIOAppUtils
    minifyAndWrite( '../phet-io/wrappers/common/js/PhETIOAppUtils.js', copyrightHeader, 'window.useRelativeSimPath=true;' );

    minifyAndWrite( '../query-string-machine/js/QueryStringMachine.js',
      '// Copyright 2016 University of Colorado Boulder\n// MIT License', '' );
  };

  if ( skipBuild ) {
    grunt.file.mkdir( 'build/phet-io' );
    createOtherPhETIOFiles();
  } else {
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