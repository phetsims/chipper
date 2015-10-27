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
  var exampleFileText = grunt.file.read( '../together/examples/mirror-input-events.html' );
  exampleFileText = ChipperStringUtils.replaceAll(
    exampleFileText,
    '// This URL is replaced with a built html file when this file is used as a template during the build process',
    'URL = \'' + buildConfig.name + '_en.html\';'
  );
  exampleFileText = ChipperStringUtils.replaceAll(
    exampleFileText,
    '../js/SimIFrameClient.js',
    'SimIFrameClient.js'
  );
  grunt.file.write( 'build/mirror-input-events.html', exampleFileText );
};
