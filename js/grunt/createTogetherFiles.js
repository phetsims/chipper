// Copyright 2002-2015, University of Colorado Boulder

/**
 *
 */

// modules
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see getBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

// TODO: chipper#101 eek, this is scary! we are importing from the repository dir. ideally we should just have uglify-js installed once in chipper?
  var uglify = require( '../../../' + buildConfig.name + '/node_modules/uglify-js' );

  var minified = uglify.minify( [ '../together/js/SimIFrameClient.js' ], {
    mangle: true,
    output: {
      inline_script: true, // escape </script
      beautify: false
    },
    compress: {
      global_defs: {}
    }
  } ).code;

  var copyrightHeader = '// Copyright 2002-2015, University of Colorado Boulder\n' +
                        '// For licensing, please contact phethelp@colorado.edu';
  grunt.file.write( 'build/SimIFrameClient.js', copyrightHeader + '\n' + minified );

  // Create a mirror-input-events.html file for testing.

  var filter = function( inputFilename, outputFilename ) {

    // Default to the input filename if not specified
    outputFilename = outputFilename || inputFilename;

    var text = grunt.file.read( '../together/examples/' + inputFilename );
    text = ChipperStringUtils.replaceAll( text,
      '../js/SimIFrameClient.js',
      'SimIFrameClient.js'
    );

    text = ChipperStringUtils.replaceAll(
      text,
      '// This URL is replaced with a built html file when this file is used as a template during the build process',
      'URL = \'' + buildConfig.name + '_en.html\';'
    );
    text = ChipperStringUtils.replaceAll(
      text,
      '../js/SimIFrameClient.js',
      'SimIFrameClient.js'
    );
    var camelCase = ChipperStringUtils.toCamelCase( buildConfig.name );

    // TODO: Regex or more matches
    text = ChipperStringUtils.replaceAll(
      text,
      'togetherID: \'concentration.sim\'',
      'togetherID: \'' + camelCase + '.sim\''
    );
    text = ChipperStringUtils.replaceAll(
      text,
      '\'faradaysLaw.sim',
      '\'' + camelCase + '.sim'
    );
    text = ChipperStringUtils.replaceAll(
      text,
      'src="../html/color-vision-together.html?brand=phet-io&togetherEvents.storeInitialMessages"',
      'src="' + buildConfig.name + '_en.html?togetherEvents.storeInitialMessages"'
    );
    grunt.file.write( 'build/' + outputFilename, text );
  };
  filter( 'mirror-input-events.html' );
  filter( 'index.html', 'together-index.html' );
  filter( 'event-log.html' );
  filter( 'state.html' );

  // Include the logo
  grunt.file.copy( '../together/examples/logo-on-white.png', 'build/logo-on-white.png' );
};
