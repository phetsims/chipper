// Copyright 2015, University of Colorado Boulder

/**
 * Creates files required for the phet-io branded simulation.
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

  var destinationPath = 'build/';

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

          // Replace variations of the repository name
          //contents = ChipperStringUtils.replaceAll( contents, 'simula-rasa', repositoryName );
          //contents = ChipperStringUtils.replaceAll( contents, 'SIMULA_RASA', configPath );
          //contents = ChipperStringUtils.replaceAll( contents, 'simulaRasa', lowerCamelCase );
          //contents = ChipperStringUtils.replaceAll( contents, 'SimulaRasa', upperCamelCase );
          //contents = ChipperStringUtils.replaceAll( contents, 'Simula Rasa', title );
          //
          //// Replace author
          //contents = ChipperStringUtils.replaceAll( contents, 'Your Name (Your Affiliation)', author );
          //
          //// Replace names in the path where the contents will be written

          //contentsPath = ChipperStringUtils.replaceFirst( contentsPath, 'simula-rasa', repositoryName );
          //contentsPath = ChipperStringUtils.replaceFirst( contentsPath, 'simulaRasa', lowerCamelCase );
          //contentsPath = ChipperStringUtils.replaceFirst( contentsPath, 'SimulaRasa', upperCamelCase );

          // Write the file
          grunt.file.write( contentsPath, contents );
          grunt.log.writeln( 'wrote', contentsPath );
        }

      }
    }
  );
};
