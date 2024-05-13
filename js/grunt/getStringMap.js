// Copyright 2015, University of Colorado Boulder

/**
 * Returns a map such that map[locale][stringKey] will be the string value (with fallbacks to English where needed).
 * Loads each string file only once, and only loads the repository/locale combinations necessary.
 * Requires global.phet.chipper.strings to be set by the string.js plugin.
 */
/* eslint-env node */
'use strict';

// built-in node APIs
var assert = require( 'assert' );
var path = require( 'path' );
var fs = require( 'fs' );

// modules
var localeInfo = require( '../../../chipper/js/data/localeInfo' ); // Locale information
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

var localeData = JSON.parse( fs.readFileSync( '../babel/localeData.json', 'utf8' ) );

/**
 * For a given locale, return an array of specific locales that we'll use as fallbacks, e.g.
 * 'ar_AE' => [ 'ar_AE', 'ar', 'ar_MA', 'en' ]   (note, changed from zh_CN example, which does NOT use 'zh' as a fallback anymore)
 * 'es' => [ 'es', 'en' ]
 * 'en' => [ 'en' ]
 *
 * @param {string} locale
 * @returns {Array.<string>}
 */
var localeFallbacks = function ( locale ) {
  var fallbackLocales = [];

  // Add the locale itself
  if ( locale !== ChipperConstants.FALLBACK_LOCALE ) {
    fallbackLocales.push( locale );
  }

  // Add the fallback locales
  if ( localeData[ locale ].fallbackLocales ) {
    localeData[ locale ].fallbackLocales.forEach( function ( fallbackLocale ) {
      if ( fallbackLocales.indexOf( fallbackLocale ) < 0 ) {
        fallbackLocales.push( fallbackLocale );
      }
    } );
  }

  // Add the fallback locale
  fallbackLocales.push( ChipperConstants.FALLBACK_LOCALE );

  return fallbackLocales;
};

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see getBuildConfig.js
 * @returns map[locale][stringKey]
 */
module.exports = function( grunt, buildConfig ) {

  var locales = buildConfig.availableLocales;

  var fallbackLocale = ChipperConstants.FALLBACK_LOCALE; // local var to improve readability

  assert( global.phet && global.phet.chipper && global.phet.chipper.strings, 'missing global.phet.chipper.strings' );
  assert( locales.indexOf( fallbackLocale ) !== -1, 'fallback locale is required' );

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
        throw new Error( repositoryName + ' is missing from phetLibs in package.json' );
      }
    }
  }

  // Load all the required string files into memory, so we don't load them multiple times (for each usage)
  var repoStringMap = {}; // maps [repositoryName][locale] => contents of locale string file
  stringRepositories.forEach( function( repository ) {
    repoStringMap[ repository.name ] = {};

    locales.forEach( function( locale ) {

      assert( localeData[ locale ], 'unsupported locale: ' + locale );
      var isRTL = localeData[ locale ].direction === 'rtl';

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
        grunt.log.debug( 'missing string file: ' + stringsFilename );
        fileContents = {};
      }
      var fileMap = repoStringMap[ repository.name ][ locale ] = {};

      for ( var stringKeyMissingPrefix in fileContents ) {
        var stringData = fileContents[ stringKeyMissingPrefix ];
        stringData.value = ChipperStringUtils.addDirectionalFormatting( stringData.value, isRTL );

        // Add the requirejs namespaces (eg, JOIST) to the key
        fileMap[ repository.requirejsNamespace + '/' + stringKeyMissingPrefix ] = fileContents[ stringKeyMissingPrefix ];
      }
    } );
  } );

  // combine our strings into [locale][stringKey] map, using the fallback locale where necessary
  var stringMap = {};
  locales.forEach( function( locale ) {
    stringMap[ locale ] = {};

    for ( var stringKey in global.phet.chipper.strings ) {
      var repositoryName = global.phet.chipper.strings[ stringKey ].repositoryName;

      // English fallback
      assert( repoStringMap[ repositoryName ][ fallbackLocale ][ stringKey ] !== undefined,
        `Missing string: ${stringKey} in ${repositoryName} for fallback locale: ${fallbackLocale}` );

      // Extract 'value' field from non-fallback (babel) strings file, and overwrites the default if available.
      // NOTE: fallback locales INCLUDES 'en', so we don't need a special case for it.
      var value = null;
      localeFallbacks( locale ).forEach( function( candidateLocale ) {
        if (
          value === null &&
          repoStringMap[ repositoryName ] &&
          repoStringMap[ repositoryName ][ candidateLocale ] &&
          repoStringMap[ repositoryName ][ candidateLocale ][ stringKey ] &&
          repoStringMap[ repositoryName ][ candidateLocale ][ stringKey ].value.length > 0
        ) {
          value = repoStringMap[ repositoryName ][ candidateLocale ][ stringKey ].value;
        }
      } );
      stringMap[ locale ][ stringKey ] = value;
    }
  } );

  return stringMap;
};
