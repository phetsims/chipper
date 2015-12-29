// Copyright 2015, University of Colorado Boulder

/**
 * Grunt task that ports Java strings to HTML.
 * Sample usage:
 * grunt port-java-strings --java-sim-dir=/Users/samreid/phet-svn-trunk/simulations-java/simulations/bending-light --overwrite
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see getBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  // modules
  var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // eslint-disable-line require-statement-match
  var propertiesParser = require( '../../../sherpa/lib/node-properties-parser-0.3.1' ); // eslint-disable-line require-statement-match
  var fs = require( 'fs' );

  // constants
  var simulationRoot = process.cwd();

  var javaSimDir = grunt.option( 'java-sim-dir' );
  if ( !javaSimDir ) {
    grunt.log.writeln( 'Usage: java-sim-dir is required' );
    return;
  }
  var javaSimName = javaSimDir.substring( javaSimDir.lastIndexOf( '/' ) + 1 );

  var localizationDir = javaSimDir + '/data/' + javaSimName + '/localization';
  var propertiesString = grunt.file.read( localizationDir + '/' + javaSimName + '-strings.properties' );

  var englishJavaStrings = propertiesParser.parse( propertiesString );
  var javaKeys = _.keys( englishJavaStrings );

  var englishJSONStrings = null;
  try {
    englishJSONStrings = grunt.file.readJSON( simulationRoot + '/' + buildConfig.name + '-strings_en.json' );
  }
  catch( e ) {
    grunt.log.writeln( 'could not find English JSON strings, generating them first...' );
    englishJSONStrings = {};
    for ( var kk = 0; kk < javaKeys.length; kk++ ) {
      var javaKey = javaKeys[ kk ];
      englishJSONStrings[ javaKey ] = { value: englishJavaStrings[ javaKey ] };
    }
    grunt.file.write( simulationRoot + '/' + buildConfig.name + '-strings_en.json', JSON.stringify( englishJSONStrings, null, 2 ) );
  }

  var jsKeys = _.keys( englishJSONStrings );

  var getTranslationFromSimKey = function( jsKey, locale ) {

    // If the English Java file has the same key name as JS, then look for that translated string
    if ( englishJavaStrings[ jsKey ] ) {

      return javaSimTranslations[ locale ].parsed[ jsKey ];
    }
    return null;
  };

  // If there has been a key renaming from Java to JS, we may still be able to look up the appropriate key by looking
  // at the translated values
  var getTranslationFromSimTranslation = function( jsKey, locale, matchCase ) {
    var jsValue = englishJSONStrings[ jsKey ].value;
    for ( var i = 0; i < javaKeys.length; i++ ) {
      var javaKey = javaKeys[ i ];
      var javaValue = englishJavaStrings[ javaKey ];
      //grunt.log.writeln( javaValue, '??', jsValue );
      if ( ( matchCase && (javaValue === jsValue)) || (javaValue.toLowerCase() === jsValue.toLowerCase()) ) {
        //grunt.log.writeln( 'got a match based on values for ' + jsKey + ', ' + locale + ', ' + matchCase );
        return getTranslationFromSimKey( javaKey, locale );
      }
    }

    // No other matching key found.
    return null;
  };

  var getTranslationFromAnyTranslation = function( jsKey, locale, matchCase ) {
    var jsValue = englishJSONStrings[ jsKey ].value;

    var foundValues = [];
    for ( var i = 0; i < allTranslationFiles.length; i++ ) {
      var abspath = allTranslationFiles[ i ].abspath;
      var parsed = allTranslationFiles[ i ].parsed;

      var keys = _.keys( parsed );
      for ( var j = 0; j < keys.length; j++ ) {
        var key = keys[ j ];
        if ( parsed[ key ] === jsValue || (!matchCase && (parsed[ key ].toLowerCase() === jsValue.toLowerCase())) ) {

          // Load from the corresponding localized files and take majority vote.
          // Find the file:
          var localizationDirectory = abspath.substring( 0, abspath.lastIndexOf( '/' ) );
          var localizationParentDir = localizationDirectory.substring( 0, localizationDirectory.lastIndexOf( '/' ) );
          var projectName = localizationParentDir.substring( localizationParentDir.lastIndexOf( '/' ) + 1 );
          var localizedPath = localizationDirectory + '/' + projectName + '-strings_' + locale + '.properties';
          //grunt.log.writeln( 'abspath ' + abspath );
          //grunt.log.writeln( 'localizationDir: ' + localizationDirectory );
          //grunt.log.writeln( 'projectDir: ' + localizationParentDir );
          //grunt.log.writeln( 'projectName: ' + projectName );
          //grunt.log.writeln( 'localizedPath: ' + localizedPath );

          if ( fs.existsSync( localizedPath ) ) {
            var localizedStrings = propertiesParser.parse( grunt.file.read( localizedPath ) );
            var value = localizedStrings[ key ];
            if ( value ) {
              foundValues.push( value );
            }
          }
        }
      }
    }

    if ( foundValues.length > 0 ) {
      //grunt.log.writeln( jsKey + ' (' + locale + ') found these values: ' + foundValues );
      var counts = {};

      var max = 0;
      var maxFoundValue = null;
      for ( var k = 0; k < foundValues.length; k++ ) {
        var foundValue = foundValues[ k ];
        counts[ foundValue ] = counts[ foundValue ] ? counts[ foundValue ] + 1 : 1;
        if ( counts[ foundValue ] > max ) {
          max = counts[ foundValue ];
          maxFoundValue = foundValue;
        }
      }
      grunt.log.writeln( jsKey + ' (' + locale + ') returning ' + maxFoundValue + ' with ' + counts[ maxFoundValue ] + ' votes from the following pool: ', counts );
      return maxFoundValue;
    }

    // No other matching key found.
    return null;
  };

  var getValueForJSKey = function( jsKey, locale ) {

    // Try all of the following options to find a translation
    // First, see if there is an exact key match
    // Second, check for value matches in the simulation (case sensitive, then insensitive)
    // Third, check across other simulations and common code for value matches
    return getTranslationFromSimKey( jsKey, locale )
           || getTranslationFromSimTranslation( jsKey, locale, true )
           || getTranslationFromSimTranslation( jsKey, locale, false )
           || getTranslationFromAnyTranslation( jsKey, locale, true )
           || getTranslationFromAnyTranslation( jsKey, locale, false )
      ;
  };

  var visitLocale = function( locale ) {

    var missingForLocale = [];
    var foundForLocale = [];
    var result = {};

    for ( var i = 0; i < jsKeys.length; i++ ) {
      var jsKey = jsKeys[ i ];
      var value = getValueForJSKey( jsKey, locale );

      if ( !value ) {
        //grunt.log.writeln( 'MISSING KEY: ' + jsKey );
        missingForLocale.push( jsKey );
      }
      else {
        result[ jsKey ] = { value: value };
        foundForLocale.push( jsKey );
      }
    }

    // write to babel
    var filename = simulationRoot + '/../babel/' + buildConfig.name + '/' + buildConfig.name + '-strings_' + locale + '.json';
    if ( grunt.file.exists( filename ) && !grunt.option( 'overwrite' ) ) {
      grunt.log.writeln( 'File already existed ' + filename + ', skipping...' );
    }
    else {
      grunt.file.write( filename, JSON.stringify( result, null, 2 ) );
    }
    grunt.log.writeln( locale + ': ' + foundForLocale.length + '/' + jsKeys.length + '. Missing: ' + missingForLocale );
  };

  var allTranslationFiles = [];
  var simulationsJavaRoot = javaSimDir + '/../../';
  grunt.file.recurse( simulationsJavaRoot, function callback( abspath, rootdir, subdir, filename ) {
    if ( abspath.endsWith( '-strings.properties' ) ) {
      allTranslationFiles.push( { abspath: abspath, parsed: propertiesParser.parse( grunt.file.read( abspath ) ) } );
    }
  } );
  grunt.log.writeln( 'parsed ' + allTranslationFiles.length + ' files' );

  var localeFiles = fs.readdirSync( localizationDir );

  var javaSimTranslations = {};
  for ( var i = 0; i < localeFiles.length; i++ ) {
    var file = localeFiles[ i ];
    if ( file.indexOf( '.properties' ) >= 0 && file.indexOf( '_' ) >= 0 ) {
      var locale = file.substring( file.lastIndexOf( '_' ) + 1, file.lastIndexOf( '.' ) );
      var abspath = localizationDir + '/' + file;
      javaSimTranslations[ locale ] = {
        abspath: abspath,
        parsed: propertiesParser.parse( grunt.file.read( abspath ) )
      };
    }
  }

  for ( var m = 0; m < localeFiles.length; m++ ) {
    var localeFile = localeFiles[ m ];
    if ( localeFile.indexOf( '.properties' ) >= 0 && localeFile.indexOf( '_' ) >= 0 ) {
      var localeForFile = localeFile.substring( localeFile.lastIndexOf( '_' ) + 1, localeFile.lastIndexOf( '.' ) );
      if ( localeForFile === 'fr' ) { // TODO: Undo this short circuit
        visitLocale( localeForFile );
      }
    }
  }
};