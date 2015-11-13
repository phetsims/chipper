// Copyright 2015, University of Colorado Boulder

/**
 * Creates files required for the phet-io branded simulation.
 */

// modules
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

// Copied from phet-core
function escapeHTML( str ) {
  // see https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet
  // HTML Entity Encoding
  return str
    .replace( /&/g, '&amp;' )
    .replace( /</g, '&lt;' )
    .replace( />/g, '&gt;' )
    .replace( /\"/g, '&quot;' )
    .replace( /\'/g, '&#x27;' )
    .replace( /\//g, '&#x2F;' );
};

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
  grunt.file.write( 'build/js/SimIFrameClient.js', copyrightHeader + '\n' + minified );

  // Create a mirror-input-events.html file for testing.

  var filter = function( text ) {

    text = ChipperStringUtils.replaceAll(
      text,
      '../../js/SimIFrameClient.js',
      '../js/SimIFrameClient.js'
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
      '\'concentration.sim.active\'',
      '\'' + camelCase + '.sim.active\''
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

    // Use a ?build so that use cases that require further query parameters don't have to distinguish
    // between ? and &
    text = ChipperStringUtils.replaceAll(
      text,
      '\'../../../color-vision/color-vision_en.html?brand=phet-io\'',
      '\'../' + buildConfig.name + '_en.html?build\''
    );
    text = ChipperStringUtils.replaceAll(
      text,
      '\'../../../faradays-law/faradays-law_en.html?brand=phet-io\'',
      '\'../' + buildConfig.name + '_en.html?build\''
    );
    text = ChipperStringUtils.replaceAll(
      text,
      '\'../../../concentration/concentration_en.html?brand=phet-io\'',
      '\'../' + buildConfig.name + '_en.html?build\''
    );
    //
    if ( camelCase === 'beaker' ) {
      text = ChipperStringUtils.replaceAll(
        text,
        '\'../../html/beaker-together.html?brand=phet-io&together.values=',
        '\'../' + buildConfig.name + '_en.html?build\''
      );
    }
    else {
      text = ChipperStringUtils.replaceAll(
        text,
        '<!--if camelcase===beaker-->',
        '<!--if camelcase===beaker' // don't end this comment, so the next comment will end
      );
    }
    return text;
  };

  var destinationPath = 'build';

  // Iterate over the file system and copy files, changing filenames and contents as we go.
  grunt.file.recurse( '../together/doc/', function( abspath, rootdir, subdir, filename ) {
      // skip these files
      if ( abspath.indexOf( '../simula-rasa/README.md' ) === 0 ||
           abspath.indexOf( '../simula-rasa/node_modules/' ) === 0 ||
           abspath.indexOf( '../simula-rasa/.git/' ) === 0 ||
           abspath.indexOf( '../simula-rasa/build/' ) === 0 ) {

        // do nothing
      }
      else {
        var contentsPath = subdir ? ( destinationPath + '/' + subdir + '/' + filename ) : ( destinationPath + '/' + filename );
        if ( abspath.indexOf( '.png' ) >= 0 ) {
          grunt.file.copy( abspath, contentsPath );
        }
        else {
          var contents = grunt.file.read( abspath );
          contents = filter( contents );

          // Write the file
          grunt.file.write( contentsPath, contents );
          grunt.log.writeln( 'wrote', contentsPath );
        }

      }
    }
  );

  // Also update the together/doc/index.html for any file contents it includes
  if ( grunt.option( 'together-doc' ) ) {
    console.log( 'running together-doc' )
    var text = grunt.file.read( '../together/doc/index.html' );
    var startKey = '<!--START_active.html-->';
    var endKey = '<!--END_active.html-->';
    var startIndex = text.indexOf( startKey ) + startKey.length;
    var endIndex = text.indexOf( endKey );
    var replacement = grunt.file.read( '../together/doc/examples/active.html' );
    replacement = filter( replacement ); // neat!
    replacement = escapeHTML( replacement );
    var newText = text.substring( 0, startIndex ) + replacement + text.substring( endIndex );
    grunt.file.write( '../together/doc/index.html', newText );
  }
};
