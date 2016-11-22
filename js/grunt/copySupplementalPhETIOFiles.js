// Copyright 2016, University of Colorado Boulder

/**
 *
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Matt Pennington (PhET Interactive Simulations)
 */

// modules
var copyDirectory = require( '../../../chipper/js/grunt/copyDirectory' );
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

module.exports = function( grunt, buildConfig ) {
  'use strict';

  // TODO: chipper#101 eek, this is scary! we are importing from the repository dir. ideally we should just have uglify-js installed once in chipper?
  var uglify = require( '../../../' + buildConfig.name + '/node_modules/uglify-js' );

  // output the SimIFrameClient.js and WrapperUtils.js to the top level lib (not password-protected), see https://github.com/phetsims/phet-io/issues/353
  grunt.file.mkdir( 'build/lib' );

  var filterWrapper = function( abspath, contents ) {
    var originalContents = contents + '';

    if ( abspath.indexOf( '.js' ) >= 0 || abspath.indexOf( '.html' ) >= 0 ) {
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_NAME}}', buildConfig.name );
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_VERSION}}', buildConfig.version );
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
        '"../../../sherpa/lib/jquery-ui-1.8.24.min.js"',
        '"https://code.jquery.com/ui/1.8.24/jquery-ui.min.js"'
      );
      contents = ChipperStringUtils.replaceAll( contents,
        '"../../../sherpa/lib/d3-4.2.2.js"',
        '"https://cdnjs.cloudflare.com/ajax/libs/d3/4.2.2/d3.min.js"'
      );

      // Replacing queryStringMachine with empty because 'phetio.js' has it in them.
      contents = ChipperStringUtils.replaceAll( contents,
        '"../../../query-string-machine/js/QueryStringMachine.js"',
        ''
      );
      contents = ChipperStringUtils.replaceAll( contents,
        '<!--{{phetio.js}}-->',
        '<script type="text/javascript" src="../../lib/phetio.js"></script>'
      );
      contents = ChipperStringUtils.replaceAll( contents,
        '<!--{{GOOGLE_ANALYTICS.js}}-->',
        '<script type="text/javascript" src="/assets/js/phet-io-ga.js"></script>'
      );
      contents = ChipperStringUtils.replaceAll( contents,
        '<!--{{FAVICON.ico}}-->',
        '<link rel="shortcut icon" href="/assets/favicon.ico">'
      );
      contents = ChipperStringUtils.replaceAll( contents,
        '<script type="text/javascript" src="../../../assert/js/assert.js"></script>',
        '<script>' + grunt.file.read( '../assert/js/assert.js' ) + '</script>'
      );
      //template uses exclusively "

      contents = ChipperStringUtils.replaceAll( contents, '../../js/', '../../lib/' );
    }
    if ( contents !== originalContents ) {
      return contents;
    }
    else {
      return null; // signify no change (helps for images)
    }
  };
  copyDirectory( grunt, '../phet-io/wrappers', 'build/wrappers', filterWrapper );

  var devguideHTML = grunt.file.read( '../phet-io-website/root/devguide/index.html' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '/assets/bootstrap-3.3.6-dist/css/bootstrap.min.css', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '/assets/bootstrap-3.3.6-dist/js/bootstrap.min.js', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '/assets/font-awesome-4.5.0/css/font-awesome.min.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.5.0/css/font-awesome.min.css' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '/assets/js/jquery-1.12.3.min.js', 'https://code.jquery.com/jquery-1.12.3.min.js' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '/assets/css/', './css/' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '/assets/js/', './js/' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '/assets/highlight.js-9.1.0/styles/tomorrow-night-bright.css', 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.1.0/styles/tomorrow-night-bright.min.css' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '/assets/highlight.js-9.1.0/highlight.js', 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.1.0/highlight.min.js' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '/assets/favicon.ico', './favicon.ico' );
  grunt.file.write( 'build/docs/devguide.html', devguideHTML );
  copyDirectory( grunt, '../phet-io-website/root/assets/css', 'build/docs/css', filterWrapper );
  grunt.file.copy( '../phet-io-website/root/assets/js/phet-io.js', './build/docs/js/phet-io.js' );
  grunt.file.copy( '../phet-io-website/root/assets/js/phet-io-ga.js', './build/docs/js/phet-io-ga.js' );
  grunt.file.copy( '../phet-io-website/root/assets/favicon.ico', './build/docs/favicon.ico' );


  // Minify phet libraries into 'lib/phetio.js'
  var DESTINATION_PATH = 'build/lib';
  var OUTPUT_FILE = 'phetio.js';
  var COPYRIGHT_HEADER = '// Copyright 2002-2016, University of Colorado Boulder\n' +
                         '// This PhET-iO file requires a license\n' +
                         '// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' +
                         '// For licensing, please contact phethelp@colorado.edu';

  // Determine which sim versions will be pointed to by WrapperUtils
  var PRECODE = 'window.useRelativeSimPath=true;';

  var LIB_FILES = [
    '../query-string-machine/js/QueryStringMachine.js',
    '../phet-io/wrappers/common/js/SimIFrameClient.js',
    '../phet-io/wrappers/common/js/assert.js',
    '../phet-io/wrappers/common/js/WrapperUtils.js' ];


  var minified = uglify.minify( LIB_FILES, {
    mangle: true,
    output: {
      inline_script: true, // escape </script
      beautify: false
    },
    compress: {
      global_defs: {}
    }
  } ).code;

  grunt.file.write( DESTINATION_PATH + '/' + OUTPUT_FILE, COPYRIGHT_HEADER + '\n\n' + PRECODE + minified );

};