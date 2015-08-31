// Copyright 2002-2015, University of Colorado Boulder

/**
 * Returns a map such that map[locale][stringKey] will be the string value (with fallbacks to English where needed).
 * Loads each string file only once, and only loads the repository/locale combinations necessary.
 * Requires global.phet.chipper.strings to be set by the string.js plugin.
 */

// built-in node APIs
var assert = require( 'assert' );
var path = require( 'path' );

// modules
var localeInfo = require( '../../../chipper/js/data/localeInfo' ); // Locale information
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see getBuildConfig.js
 * @returns map[locale][stringKey]
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  var fallbackLocale = ChipperConstants.FALLBACK_LOCALE; // local var to improve readability

  assert( global.phet && global.phet.chipper && global.phet.chipper.strings, 'missing global.phet.chipper.strings' );
  assert( buildConfig.locales.indexOf( fallbackLocale ) !== -1, 'fallback locale is required' );

  // Get metadata of repositories that we want to load strings from (that were referenced in the sim)
  var stringRepositories = []; // { name: {string}, path: {string}, requirejsNamespace: {string} }
  for ( var stringKey in global.phet.chipper.strings ) {
    var repositoryName = global.phet.chipper.strings[ stringKey ].repositoryName;

    if ( stringRepositories.every( function( repo ) { return repo.name !== repositoryName; } ) ) {
      stringRepositories.push( {
        name: repositoryName,
        path: global.phet.chipper.strings[ stringKey ].repositoryPath,
        requirejsNamespace: global.phet.chipper.strings[ stringKey ].requirejsNamespace
      } );

      // If a string depends on an unlisted dependency, fail out
      if ( buildConfig.phetLibs.indexOf( repositoryName ) < 0 ) {
        throw new Error( repositoryName + ' is missing from phetLib in package.json' );
      }
    }
  }

  // Load all the required string files into memory, so we don't load them multiple times (for each usage)
  var repoStringMap = {}; // maps [repositoryName][locale] => contents of locale string file
  stringRepositories.forEach( function( repository ) {
    repoStringMap[ repository.name ] = {};

    buildConfig.locales.forEach( function( locale ) {

      assert( localeInfo[ locale ], 'unsupported locale: ' + locale );
      var isRTL = localeInfo[ locale ].direction === 'rtl';

      var basePath;
      // pick a location that is in the repo, or babel
      if ( locale === fallbackLocale ) {
        basePath = repository.path + '/';
      }
      else {
        basePath = repository.path + '/../babel/' + repository.name + '/';
      }

      // Read optional string file
      var stringsFilename = path.normalize( basePath + repository.name + '-strings_' + locale + '.json' );
      var fileContents;
      try {
        fileContents = grunt.file.readJSON( stringsFilename );
      }
      catch( error ) {
        grunt.log.warn( 'missing string file: ' + stringsFilename );
        fileContents = {};
      }
      var fileMap = repoStringMap[ repository.name ][ locale ] = {};

      for ( var stringKeyMissingPrefix in fileContents ) {
        var stringData = fileContents[ stringKeyMissingPrefix ];

        // Pad LTR/RTL language values with unicode embedding marks (see https://github.com/phetsims/joist/issues/152)
        // Uses directional formatting characters: http://unicode.org/reports/tr9/#Directional_Formatting_Characters
        stringData.value = ( isRTL ? '\u202b' : '\u202a' ) + stringData.value + '\u202c';

        // Add the requirejs namespaces (eg, JOIST) to the key
        fileMap[ repository.requirejsNamespace + '/' + stringKeyMissingPrefix ] = fileContents[ stringKeyMissingPrefix ];
      }
    } );
  } );

  // combine our strings into [locale][stringKey] map, using the fallback locale where necessary
  var stringMap = {};
  buildConfig.locales.forEach( function( locale ) {
    stringMap[ locale ] = {};

    for ( var stringKey in global.phet.chipper.strings ) {
      var repositoryName = global.phet.chipper.strings[ stringKey ].repositoryName;

      // English fallback
      assert( repoStringMap[ repositoryName ][ fallbackLocale ][ stringKey ] !== undefined,
        'Missing string: ' + stringKey + ' in ' + repositoryName + ' for fallback locale: ' + fallbackLocale );
      var fallbackString = repoStringMap[ repositoryName ][ fallbackLocale ][ stringKey ].value;
      stringMap[ locale ][ stringKey ] = fallbackString;

      // Extract 'value' field from non-fallback (babel) strings file, and overwrites the default if available.
      if ( locale !== fallbackLocale &&
           repoStringMap[ repositoryName ] &&
           repoStringMap[ repositoryName ][ locale ] &&
           repoStringMap[ repositoryName ][ locale ][ stringKey ] &&

           // If the string in rosetta is empty we want to use the fallback locale string.
           // Test for length of 2 and not 0 because the directional embedding marks are included in empty strings.
           repoStringMap[ repositoryName ][ locale ][ stringKey ].value.length > 2 ) {
        stringMap[ locale ][ stringKey ] = repoStringMap[ repositoryName ][ locale ][ stringKey ].value;
      }
    }
  } );                                                                            #33

  return stringMap;
};
