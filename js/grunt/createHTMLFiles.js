// Copyright 2002-2015, University of Colorado Boulder

/**
 * Creates locale-specific HTML files by populating a template.
 *
 * This is one step in the 'after-requirejs-build' task.
 * See afterRequirejsBuild.js for documentation on how this step fits into that asynchronous task.
 */

// built-in node APIs
var assert = require( 'assert' );

// modules
var loadFileAsDataURI = require( '../../../chipper/js/common/loadFileAsDataURI' );
var getStringMap = require( '../../../chipper/js/grunt/getStringMap' );
var getThirdPartyLibEntries = require( '../../../chipper/js/grunt/getThirdPartyLibEntries' );
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

/**
 * @param grunt - the grunt instance
 * @param buildConfig - see getBuildConfig.js
 * @param {string} dependencies - dependencies information, including shas and branches for repositories
 * @param mipmapsJavaScript - script for mipmaps
 * @param {function} nextStep - called when this step is completed
 */
module.exports = function( grunt, buildConfig, dependencies, mipmapsJavaScript, nextStep ) {
  'use strict';

  var fallbackLocale = ChipperConstants.FALLBACK_LOCALE;

  // TODO: chipper#101 eek, this is scary! we are importing from the repository dir. ideally we should just have uglify-js installed once in chipper?
  var uglify = require( '../../../' + buildConfig.name + '/node_modules/uglify-js' );

  // stringMap[locale][stringKey] give us a string
  var stringMap = getStringMap( grunt, buildConfig );

  // Get the title and version to display in the HTML header.
  // The HTML header is not internationalized, so order can just be hard coded here, see #156
  var simTitle = stringMap.en[ buildConfig.simTitleStringKey ];
  assert( simTitle, 'missing value for sim title key ' + buildConfig.simTitleStringKey );
  var simTitleAndVersion = simTitle + ' ' + buildConfig.version;

  // Select the HTML comment header based on the brand, see https://github.com/phetsims/chipper/issues/156
  var htmlHeader = null;
  if ( buildConfig.brand === 'phet-io' ) {

    // License text provided by @kathy-phet in https://github.com/phetsims/chipper/issues/148#issuecomment-112584773
    htmlHeader = simTitleAndVersion + '\n' +
                 'Copyright 2002-' + grunt.template.today( 'yyyy' ) + ', Regents of the University of Colorado\n' +
                 'PhET Interactive Simulations, University of Colorado Boulder\n' +
                 '\n' +
                 'This Interoperable PhET Simulation file requires a license.\n' +
                 'USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' +
                 'Contact phethelp@colorado.edu regarding licensing.\n' +
                 'http://phet.colorado.edu/en/licensing';
  }
  else {
    htmlHeader = simTitleAndVersion + '\n' +
                 'Copyright 2002-' + grunt.template.today( 'yyyy' ) + ', Regents of the University of Colorado\n' +
                 'PhET Interactive Simulations, University of Colorado Boulder\n' +
                 '\n' +
                 'This file is licensed under Creative Commons Attribution 4.0\n' +
                 'For alternate source code licensing, see https://github.com/phetsims\n' +
                 'For licenses for third-party software used by this simulation, see below\n' +
                 'For more information, see http://phet.colorado.edu/en/licensing/html\n' +
                 '\n' +
                 'The PhET name and PhET logo are registered trademarks of The Regents of the\n' +
                 'University of Colorado. Permission is granted to use the PhET name and PhET logo\n' +
                 'only for attribution purposes. Use of the PhET name and/or PhET logo for promotional,\n' +
                 'marketing, or advertising purposes requires a separate license agreement from the\n' +
                 'University of Colorado. Contact phethelp@colorado.edu regarding licensing.';
  }

  // Load the splash SVG from the appropriate brand.
  var splashDataURI = loadFileAsDataURI( '../brand/' + buildConfig.brand + '/images/splash.svg' );

  // Minify scripts that will be preloaded in the HMTL file.
  grunt.log.debug( 'Minifying preload scripts' );
  var preloadBlocks = '';
  for ( var libIdx = 0; libIdx < buildConfig.preload.length; libIdx++ ) {
    var lib = buildConfig.preload[ libIdx ];
    var preloadResult = uglify.minify( [ lib ], {
      output: {
        inline_script: true // escape </script
      },
      compress: {
        global_defs: {}
      }
    } );
    preloadBlocks += '<script type="text/javascript" id="script-' + lib + '">\n' + preloadResult.code + '\n</script>\n';
  }

  // Load the optimized code for the sim.
  var mainInlineJavascript = grunt.file.read( 'build/' + buildConfig.name + '.min.js' );

  // workaround for Uglify2's Unicode unescaping. see https://github.com/phetsims/chipper/issues/70
  preloadBlocks = preloadBlocks.replace( '\x0B', '\\x0B' );
  mainInlineJavascript = mainInlineJavascript.replace( '\x0B', '\\x0B' );

  // Replace tokens in the template
  grunt.log.debug( 'Constructing HTML from template' );
  var html = grunt.file.read( '../chipper/templates/sim.html' );
  // Strip out carriage returns (if building in Windows), then add in our own after the MOTW.
  // See https://github.com/phetsims/joist/issues/164
  html = html.replace( /\r/g, '' );
  html = ChipperStringUtils.replaceFirst( html, 'CARRIAGE_RETURN', '\r' );
  html = ChipperStringUtils.replaceFirst( html, 'HTML_HEADER', htmlHeader );
  html = ChipperStringUtils.replaceFirst( html, 'PHET_MIPMAPS_JAVASCRIPT', mipmapsJavaScript );
  html = ChipperStringUtils.replaceFirst( html, 'SPLASH_SCREEN_DATA_URI', splashDataURI );
  html = ChipperStringUtils.replaceFirst( html, 'PRELOAD_INLINE_JAVASCRIPT', preloadBlocks );
  html = ChipperStringUtils.replaceFirst( html, 'MAIN_INLINE_JAVASCRIPT', '<script type="text/javascript">' + mainInlineJavascript + '</script>' );
  html = ChipperStringUtils.replaceFirst( html, 'START_THIRD_PARTY_LICENSE_ENTRIES', ChipperConstants.START_THIRD_PARTY_LICENSE_ENTRIES );
  html = ChipperStringUtils.replaceFirst( html, 'END_THIRD_PARTY_LICENSE_ENTRIES', ChipperConstants.END_THIRD_PARTY_LICENSE_ENTRIES );

  //TODO #318 is this used by Rosetta?
  // Write the stringless template in case we want to use it with the translation addition process.
  // Skip it if only building one HTML.
  if ( buildConfig.locales.length > 1 ) {
    grunt.log.debug( 'Writing stringless HTML file' );
    grunt.file.write( 'build/' + buildConfig.name + '_STRING_TEMPLATE.html', html );
  }

  //TODO Is it ok to be modifying html after we wrote repo_STRING_TEMPLATE.html above?
  html = ChipperStringUtils.replaceFirst( html, 'PHET_SHAS', dependencies );

  // Add license entries for third-party media files that were loaded by media plugins.
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
              // during plugin loading, so this is a "double check"
              if ( buildConfig.brand === 'phet' || buildConfig.brand === 'phet-io' ) {
                grunt.log.error( 'No license.json entry for ' + resourceName );
              }
            }
            else if ( licenseEntry.projectURL !== 'http://phet.colorado.edu' ) {
              thirdPartyEntries[ mediaType ] = thirdPartyEntries[ mediaType ] || {};
              thirdPartyEntries[ mediaType ][ resourceName ] = licenseEntry;
            }
          }
        }
      }
    }
  }
  html = ChipperStringUtils.replaceFirst( html, 'THIRD_PARTY_LICENSE_ENTRIES', JSON.stringify( thirdPartyEntries, null, 2 ) );

  // Create locale-specific HTML files
  for ( var i = 0; i < buildConfig.locales.length; i++ ) {
    var locale = buildConfig.locales[ i ];

    var localeHTML = ChipperStringUtils.replaceFirst( html, 'PHET_STRINGS', JSON.stringify( stringMap[ locale ], null, '' ) );

    var timestamp = new Date().toISOString().split( 'T' ).join( ' ' );
    timestamp = timestamp.substring( 0, timestamp.indexOf( '.' ) ) + ' UTC';

    //TODO: if this is for changing layout, we'll need these globals in requirejs mode
    //Make the locale accessible at runtime (e.g., for changing layout based on RTL languages), see #40
    localeHTML = ChipperStringUtils.replaceFirst( localeHTML, 'PHET_PROJECT', buildConfig.name );
    localeHTML = ChipperStringUtils.replaceFirst( localeHTML, 'PHET_VERSION', buildConfig.version );
    localeHTML = ChipperStringUtils.replaceFirst( localeHTML, 'PHET_BUILD_TIMESTAMP', timestamp );
    localeHTML = ChipperStringUtils.replaceFirst( localeHTML, 'PHET_LOCALE', locale );
    localeHTML = ChipperStringUtils.replaceFirst( localeHTML, 'SIM_TITLE', stringMap[ locale ][ buildConfig.simTitleStringKey ] + ' ' + buildConfig.version ); //TODO: i18n order

    // TODO: chipper#270 workaround, part 2 (see part 1 in getBuildConfig.js)
    if ( buildConfig.brand === 'phet-io' ) {
      var devVersion = buildConfig.version.replace( '-together', '-dev' );
      localeHTML = localeHTML.replace( devVersion, buildConfig.version );
    }

    grunt.file.write( 'build/' + buildConfig.name + '_' + locale + '.html', localeHTML );
  }

  //TODO should this be using ChipperConstants.FALLBACK_LOCALE instead of hardcoded to 'en'?
  // Create a file for testing iframe embedding.  English (en) is assumed as the locale.
  grunt.log.debug( 'Constructing HTML for iframe testing from template' );
  var iframeTestHtml = grunt.file.read( '../chipper/templates/sim-iframe.html' );
  iframeTestHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, 'SIM_TITLE', stringMap[ fallbackLocale ][ buildConfig.simTitleStringKey ] + ' ' + buildConfig.version + ' iframe test' );
  iframeTestHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, 'SIM_URL', buildConfig.name + '_en.html' );
  grunt.file.write( 'build/' + buildConfig.name + '_en-iframe' + '.html', iframeTestHtml );

  //TODO chipper#318 is this being used by Rosetta?
  // Write the string map, which may be used by Rosetta for showing which strings are available for translation
  var stringMapFilename = 'build/' + buildConfig.name + '_string-map.json';
  grunt.log.debug( 'Writing string map to ', stringMapFilename );
  grunt.file.write( stringMapFilename, JSON.stringify( stringMap[ fallbackLocale ], null, '\t' ) );

  grunt.log.debug( 'Cleaning temporary files' );
  grunt.file.delete( 'build/' + buildConfig.name + '.min.js' );

  nextStep();
};
