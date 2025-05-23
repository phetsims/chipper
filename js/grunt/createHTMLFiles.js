// Copyright 2015, University of Colorado Boulder

/**
 * Creates locale-specific HTML files by populating a template.
 *
 * This is one step in the 'after-requirejs-build' task.
 * See afterRequirejsBuild.js for documentation on how this step fits into that asynchronous task.
 */
/* eslint-env node */
'use strict';

// built-in node APIs
var assert = require( 'assert' );
var fs = require( 'fs' );

// third-party node APIs
var nodeHTMLEncoder = require( 'node-html-encoder' ); // eslint-disable-line require-statement-match

// constants
var Encoder = nodeHTMLEncoder.Encoder;

// modules
var loadFileAsDataURI = require( '../../../chipper/js/common/loadFileAsDataURI' );
var getStringMap = require( '../../../chipper/js/grunt/getStringMap' );
var getThirdPartyLibEntries = require( '../../../chipper/js/grunt/getThirdPartyLibEntries' );
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );
var zlib = require( 'zlib' );

var localeDataFile = JSON.parse( fs.readFileSync( '../babel/localeData.json', 'utf-8' ) );

/**
 * @param grunt - the grunt instance
 * @param buildConfig - see getBuildConfig.js
 * @param {string} dependencies - dependencies information, including shas and branches for repositories
 * @param mipmapsJavaScript - script for mipmaps
 * @param {function} callback - called when this step is completed
 */
module.exports = function( grunt, buildConfig, dependencies, mipmapsJavaScript, callback ) {

  // Load localeData
  var fullLocaleData = JSON.parse( fs.readFileSync( '../babel/localeData.json', 'utf8' ) );

  // TODO: chipper#101 eek, this is scary! we are importing from the node_modules dir. ideally we should just have uglify-js installed once in sherpa?
  var uglify = require( '../../../chipper/node_modules/uglify-js' );// eslint-disable-line require-statement-match

  // stringMap[locale][stringKey] give us a string
  var stringMap = getStringMap( grunt, buildConfig );

  // HTML encoder
  var encoder = new Encoder( 'entity' );

  // Get the title and version to display in the HTML header.
  // The HTML header is not internationalized, so order can just be hard coded here, see #156
  var simTitle = stringMap[ ChipperConstants.FALLBACK_LOCALE ][ buildConfig.simTitleStringKey ];
  assert( simTitle, 'missing entry for sim title, key = ' + buildConfig.simTitleStringKey );

  // Select the HTML comment header based on the brand, see https://github.com/phetsims/chipper/issues/156
  var htmlHeader = null;
  if ( buildConfig.brand === 'phet-io' ) {

    // License text provided by @kathy-phet in https://github.com/phetsims/chipper/issues/148#issuecomment-112584773
    htmlHeader = simTitle + ' ' + buildConfig.version + '\n' +
                 'Copyright 2002-' + grunt.template.today( 'yyyy' ) + ', Regents of the University of Colorado\n' +
                 'PhET Interactive Simulations, University of Colorado Boulder\n' +
                 '\n' +
                 'This Interoperable PhET Simulation file requires a license.\n' +
                 'USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' +
                 'Contact phethelp@colorado.edu regarding licensing.\n' +
                 'https://phet.colorado.edu/en/licensing';
  }
  else {
    htmlHeader = simTitle + ' ' + buildConfig.version + '\n' +
                 'Copyright 2002-' + grunt.template.today( 'yyyy' ) + ', Regents of the University of Colorado\n' +
                 'PhET Interactive Simulations, University of Colorado Boulder\n' +
                 '\n' +
                 'This file is licensed under Creative Commons Attribution 4.0\n' +
                 'For alternate source code licensing, see https://github.com/phetsims\n' +
                 'For licenses for third-party software used by this simulation, see below\n' +
                 'For more information, see https://phet.colorado.edu/en/licensing/html\n' +
                 '\n' +
                 'The PhET name and PhET logo are registered trademarks of The Regents of the\n' +
                 'University of Colorado. Permission is granted to use the PhET name and PhET logo\n' +
                 'only for attribution purposes. Use of the PhET name and/or PhET logo for promotional,\n' +
                 'marketing, or advertising purposes requires a separate license agreement from the\n' +
                 'University of Colorado. Contact phethelp@colorado.edu regarding licensing.';
  }

  // All html files share the same build timestamp
  var timestamp = new Date().toISOString().split( 'T' ).join( ' ' );
  timestamp = timestamp.substring( 0, timestamp.indexOf( '.' ) ) + ' UTC';

  // Directory on the PhET website where the latest version of the sim lives
  var latestDir = 'https://phet.colorado.edu/sims/html/' + buildConfig.name + '/latest/';

  // Load the splash SVG from the appropriate brand.
  var splashDataURI = loadFileAsDataURI( '../brand/' + buildConfig.brand + '/images/splash.svg' );

  // Minify scripts that will be preloaded in the HMTL file.
  grunt.log.debug( 'Minifying preload scripts' );
  var preloadScripts = [];
  for ( var libIdx = 0; libIdx < buildConfig.preload.length; libIdx++ ) {
    var lib = buildConfig.preload[ libIdx ];

    var processedCode;
    if ( grunt.option( 'uglify' ) === false ) {
      processedCode = global.phet.chipper.fs.readFileSync( lib, 'utf8' );
    }
    else {
      processedCode = uglify.minify( [ lib ], {
        mangle: grunt.option( 'mangle' ) !== false,
        output: {
          inline_script: true, // escape </script
          beautify: grunt.option( 'mangle' ) === false
        },
        compress: {
          global_defs: {}
        }
      } ).code;
    }

    // workaround for Uglify2's Unicode unescaping. see https://github.com/phetsims/chipper/issues/70
    preloadScripts.push( processedCode.replace( '\x0B', '\\x0B' ) );
  }

  // Load the optimized code for the sim.
  var mainInlineJavascript = grunt.file.read( 'build/' + buildConfig.name + '.min.js' );

  // workaround for Uglify2's Unicode unescaping. see https://github.com/phetsims/chipper/issues/70
  mainInlineJavascript = mainInlineJavascript.replace( '\x0B', '\\x0B' );

  // License entries for third-party media files that were loaded by media plugins.
  // The media plugins populate global.phet.chipper.licenseEntries.
  var thirdPartyEntries = {
    lib: getThirdPartyLibEntries( grunt, buildConfig )
  };
  if ( global.phet.chipper.licenseEntries ) {
    for ( var mediaType in global.phet.chipper.licenseEntries ) {
      if ( global.phet.chipper.licenseEntries.hasOwnProperty( mediaType ) ) {

        var mediaEntry = global.phet.chipper.licenseEntries[ mediaType ];

        // For each resource of that type
        for ( var resourceName in mediaEntry ) {
          if ( mediaEntry.hasOwnProperty( resourceName ) ) {

            var licenseEntry = mediaEntry[ resourceName ];

            // If it is not from PhET, it is from a 3rd party and we must include it in the report
            // But lift this restriction when building a non-phet brand
            if ( !licenseEntry ) {

              // Fail if there is no license entry.  Though this error should have been caught
              if ( buildConfig.brand === 'phet' || buildConfig.brand === 'phet-io' ) {
                // during plugin loading, so this is a "double check"
                grunt.log.error( 'No license.json entry for ' + resourceName );
              }
            }
            else if ( licenseEntry.projectURL !== 'https://phet.colorado.edu' ) {
              thirdPartyEntries[ mediaType ] = thirdPartyEntries[ mediaType ] || {};
              thirdPartyEntries[ mediaType ][ resourceName ] = licenseEntry;
            }
          }
        }
      }
    }
  }

  grunt.log.debug( 'Constructing HTML from template' );
  var html = grunt.file.read( '../chipper/templates/sim.html' );

  function replaceConstants( string, insertScripts ) {
    // Strip out carriage returns (if building on Windows), then add in our own after the MOTW (Mark Of The Web).
    // See https://github.com/phetsims/joist/issues/164 and
    // https://msdn.microsoft.com/en-us/library/ms537628%28v=vs.85%29.aspx
    string = string.replace( /\r/g, '' );
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_CARRIAGE_RETURN}}', '\r' );

    // Replace tokens in the template that are independent of locale
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_HTML_HEADER}}', htmlHeader );
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_MIPMAPS_JAVASCRIPT}}', mipmapsJavaScript );
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_SPLASH_DATA_URI}}', splashDataURI );
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_PRELOAD_JAVASCRIPT}}', preloadScripts.map( function( script ) {
      if ( insertScripts ) {
        return '<script type="text/javascript">\n' + script + '\n</script>\n';
      }
      else {
        return script + '\n';
      }
    } ).join( '\n' ) );
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_MAIN_JAVASCRIPT}}', mainInlineJavascript );
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_START_THIRD_PARTY_LICENSE_ENTRIES}}', ChipperConstants.START_THIRD_PARTY_LICENSE_ENTRIES );
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_END_THIRD_PARTY_LICENSE_ENTRIES}}', ChipperConstants.END_THIRD_PARTY_LICENSE_ENTRIES );
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_DEPENDENCIES}}', dependencies );
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_PROJECT}}', buildConfig.name );
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_VERSION}}', buildConfig.version );
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_BUILD_TIMESTAMP}}', timestamp );
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_BRAND}}', buildConfig.brand );
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_THIRD_PARTY_LICENSE_ENTRIES}}', JSON.stringify( thirdPartyEntries, null, 2 ) );

    return string;
  }

  html = replaceConstants( html, true );

  function replaceLocaleConstants( string, locale, includeAllLocales ) {

    var localizedTitle = stringMap[ locale ][ buildConfig.simTitleStringKey ];

    var stringObject = stringMap;
    if ( !includeAllLocales ) {
      stringObject = {};

      // Go through all of the potential fallback locales, and include the strings for each of them
      var requiredLocales = [ locale ];

      if ( fullLocaleData[ locale ].fallbackLocales ) {
        fullLocaleData[ locale ].fallbackLocales.forEach( function( fallbackLocale ) {
          requiredLocales.push( fallbackLocale );
        } );
      }

      requiredLocales.push( ChipperConstants.FALLBACK_LOCALE );

      requiredLocales.forEach( function( locale ) {
        stringObject[ locale ] = stringMap[ locale ];
      } );
    }

    // Include a (larger) subset of locales' localeData.
    // Always include the fallback (en)
    var includedDataLocales = [ ChipperConstants.FALLBACK_LOCALE ];
    // Include directly-used locales
    buildConfig.locales.forEach( function( locale ) {
      includedDataLocales.push( locale );
    } );
    // Include locales that will fall back to directly-used locales
    Object.keys( fullLocaleData ).forEach( function( locale ) {
      if ( fullLocaleData[ locale ].fallbackLocales && fullLocaleData[ locale ].fallbackLocales.some( function( fallbackLocale ) {
        return buildConfig.locales.includes( fallbackLocale );
      } ) ) {
        includedDataLocales.push( locale );
      }
    } );
    includedDataLocales = _.sortBy( _.uniq( includedDataLocales ) );
    var localeData = {};
    includedDataLocales.forEach( function( locale ) {
      localeData[ locale ] = fullLocaleData[ locale ];
    } );

    var bcp47Lang = localeDataFile[ locale ].bcp47;
    assert( bcp47Lang, 'Requires bcp47 language' );

    string = ChipperStringUtils.replaceFirst( string, '{{PHET_STRINGS}}', JSON.stringify( stringObject, null, '' ) );

    // Provide an initial value for the HTML lang attribute, see https://github.com/phetsims/chipper/issues/1332
    // The actual value may be changed on startup (e.g. if a locale query parameter is provided, or locale is
    // dynamically changed.
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_LANG}}', bcp47Lang );

    //TODO: if locale is being made available for changing layout, we'll need it in requirejs mode
    // Make the locale accessible at runtime (e.g., for changing layout based on RTL languages), see #40
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_LOCALE}}', locale );
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_LOCALE_DATA}}', JSON.stringify( localeData ) );
    string = ChipperStringUtils.replaceFirst( string, '{{PHET_SIM_TITLE}}', encoder.htmlEncode( localizedTitle ) );

    // metadata for Open Graph protocol, see phet-edmodo#2
    string = ChipperStringUtils.replaceFirst( string, '{{OG_TITLE}}', encoder.htmlEncode( localizedTitle ) );
    string = ChipperStringUtils.replaceFirst( string, '{{OG_URL}}', latestDir + buildConfig.name + '_' + locale + '.html' );
    string = ChipperStringUtils.replaceFirst( string, '{{OG_IMAGE}}', latestDir + buildConfig.name + '-600.png' );

    return string;
  }

  // Create locale-specific HTML files
  for ( var i = 0; i < buildConfig.locales.length; i++ ) {
    var locale = buildConfig.locales[ i ];

    var localeHTML = replaceLocaleConstants( html, locale, false );

    // phet-io simulations end in "phetio", see https://github.com/phetsims/phet-io/issues/288
    var filename = 'build/' + buildConfig.name + '_' + locale;
    if ( buildConfig.brand === 'phet-io' ) {
      filename = filename + '-phetio';
    }
    filename = filename + '.html';

    // Write the single-file built simulation file
    grunt.file.write( filename, localeHTML );
  }

  // Create an _all.html file
  //TODO if allHTML is truly relevant only when brand=phet, then it should fail instead of being silently ignored
  if ( grunt.option( 'allHTML' ) && buildConfig.brand === 'phet' ) {
    var allHTMLFilename = 'build/' + buildConfig.name + '_all.html';
    var allHTMLContents = replaceLocaleConstants( html, ChipperConstants.FALLBACK_LOCALE, true ) ;
    grunt.file.write( allHTMLFilename, allHTMLContents );
    grunt.file.write( allHTMLFilename + '.gz', zlib.gzipSync( allHTMLContents ) );
  }

  // Create a file for testing iframe embedding.  English (en) is assumed as the locale.
  // phet-io sims should be tested in more powerful wrappers instead of the iframe test.
  if ( buildConfig.locales.indexOf( ChipperConstants.FALLBACK_LOCALE ) !== -1 && buildConfig.brand !== 'phet-io' ) {
    grunt.log.debug( 'Constructing HTML for iframe testing from template' );
    var iframeTestHtml = grunt.file.read( '../chipper/templates/sim-iframe.html' );
    iframeTestHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, '{{PHET_SIM_TITLE}}', encoder.htmlEncode( simTitle + ' iframe test' ) );
    iframeTestHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, '{{PHET_SIM_URL}}', buildConfig.name + '_' + ChipperConstants.FALLBACK_LOCALE + '.html' );
    grunt.file.write( 'build/' + buildConfig.name + '_' + ChipperConstants.FALLBACK_LOCALE + '-iframe' + '.html', iframeTestHtml );
  }

  // string-map.json and english-string-map.json, for things like Rosetta that need to know what strings are used
  grunt.file.write( 'build/string-map.json', JSON.stringify( stringMap, null, 2 ) );
  grunt.file.write( 'build/english-string-map.json', JSON.stringify( stringMap.en, null, 2 ) );

  grunt.log.debug( 'Cleaning temporary files' );
  grunt.file.delete( 'build/' + buildConfig.name + '.min.js' );

  callback();
};
