// Copyright 2015, University of Colorado Boulder

/**
 * Creates locale-specific HTML files by populating a template.
 *
 * This is one step in the 'after-requirejs-build' task.
 * See afterRequirejsBuild.js for documentation on how this step fits into that asynchronous task.
 */

// built-in node APIs
var assert = require( 'assert' );

// third-party node APIs
var Encoder = require( 'node-html-encoder' ).Encoder;

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
 * @param {function} callback - called when this step is completed
 */
module.exports = function( grunt, buildConfig, dependencies, mipmapsJavaScript, callback ) {
  'use strict';

  // TODO: chipper#101 eek, this is scary! we are importing from the repository dir. ideally we should just have uglify-js installed once in chipper?
  var uglify = require( '../../../' + buildConfig.name + '/node_modules/uglify-js' );

  // stringMap[locale][stringKey] give us a string
  var stringMap = getStringMap( grunt, buildConfig );

  // HTML encoder
  var encoder = new Encoder( 'entity' );

  // Get the title and version to display in the HTML header.
  // The HTML header is not internationalized, so order can just be hard coded here, see #156
  var simTitle = stringMap[ ChipperConstants.FALLBACK_LOCALE ][ buildConfig.simTitleStringKey ];
  assert( simTitle, 'missing entry for sim title, key = ' + buildConfig.simTitleStringKey );
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

  // All html files share the same build timestamp
  var timestamp = new Date().toISOString().split( 'T' ).join( ' ' );
  timestamp = timestamp.substring( 0, timestamp.indexOf( '.' ) ) + ' UTC';

  // Directory on the PhET website where the latest version of the sim lives
  var latestDir = 'http://phet.colorado.edu/sims/html/' + buildConfig.name + '/latest/';

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

  // Supply the phet-io startup sequence, see together#181
  if ( buildConfig.brand === 'phet-io' ) {
    var phetIOLaunchTemplate = grunt.file.read( '../chipper/templates/phet-io-launch.js' );
    mainInlineJavascript = ChipperStringUtils.replaceFirst( phetIOLaunchTemplate, '/*MAIN_INLINE_JAVASCRIPT*/', mainInlineJavascript );
  }

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
            else if ( licenseEntry.projectURL !== 'http://phet.colorado.edu' ) {
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
  var chromeHTML = grunt.file.read( '../chipper/templates/sim-chrome-web-store.html' );
  var chipperNamespaceJavascript = grunt.file.read( '../chipper/templates/chipper-namespace.js' );
  var chipperStringSetupJavascript = grunt.file.read( '../chipper/templates/chipper-string-setup.js' );

  function replaceConstants( string, insertScripts ) {
    // Strip out carriage returns (if building on Windows), then add in our own after the MOTW (Mark Of The Web).
    // See https://github.com/phetsims/joist/issues/164 and
    // https://msdn.microsoft.com/en-us/library/ms537628%28v=vs.85%29.aspx
    string = string.replace( /\r/g, '' );
    string = ChipperStringUtils.replaceFirst( string, 'PHET_CARRIAGE_RETURN', '\r' );

    // Replace tokens in the template that are independent of locale
    string = ChipperStringUtils.replaceFirst( string, 'PHET_HTML_HEADER', htmlHeader );
    string = ChipperStringUtils.replaceFirst( string, 'PHET_MIPMAPS_JAVASCRIPT', mipmapsJavaScript );
    string = ChipperStringUtils.replaceFirst( string, 'PHET_SPLASH_DATA_URI', splashDataURI );
    string = ChipperStringUtils.replaceFirst( string, 'PHET_PRELOAD_JAVASCRIPT', preloadScripts.map( function( script ) {
      if ( insertScripts ) {
        return '<script type="text/javascript">\n' + script + '\n</script>\n';
      }
      else {
        return script + '\n';
      }
    } ).join( '\n' ) );
    string = ChipperStringUtils.replaceFirst( string, 'PHET_MAIN_JAVASCRIPT', mainInlineJavascript );
    string = ChipperStringUtils.replaceFirst( string, 'PHET_START_THIRD_PARTY_LICENSE_ENTRIES', ChipperConstants.START_THIRD_PARTY_LICENSE_ENTRIES );
    string = ChipperStringUtils.replaceFirst( string, 'PHET_END_THIRD_PARTY_LICENSE_ENTRIES', ChipperConstants.END_THIRD_PARTY_LICENSE_ENTRIES );
    string = ChipperStringUtils.replaceFirst( string, 'PHET_DEPENDENCIES', dependencies );
    string = ChipperStringUtils.replaceFirst( string, 'PHET_PROJECT', buildConfig.name );
    string = ChipperStringUtils.replaceFirst( string, 'PHET_VERSION', buildConfig.version );
    string = ChipperStringUtils.replaceFirst( string, 'PHET_BUILD_TIMESTAMP', timestamp );
    string = ChipperStringUtils.replaceFirst( string, 'PHET_BRAND', buildConfig.brand );
    string = ChipperStringUtils.replaceFirst( string, 'PHET_THIRD_PARTY_LICENSE_ENTRIES', JSON.stringify( thirdPartyEntries, null, 2 ) );

    return string;
  }

  html = replaceConstants( html, true );
  chromeHTML = replaceConstants( chromeHTML, false );
  chipperNamespaceJavascript = replaceConstants( chipperNamespaceJavascript, false );
  chipperStringSetupJavascript = replaceConstants( chipperStringSetupJavascript, false );

  function replaceLocaleConstants( string, locale, includeAllLocales ) {
    var localeTitleAndVersion = stringMap[ locale ][ buildConfig.simTitleStringKey ] + ' ' + buildConfig.version; //TODO: i18n order

    var stringObject = stringMap;
    if ( !includeAllLocales ) {
      stringObject = {};
      stringObject[ locale ] = stringMap[ locale ];
    }

    string = ChipperStringUtils.replaceFirst( string, 'PHET_STRINGS', JSON.stringify( stringObject, null, '' ) );

    //TODO: if locale is being made available for changing layout, we'll need it in requirejs mode
    // Make the locale accessible at runtime (e.g., for changing layout based on RTL languages), see #40
    string = ChipperStringUtils.replaceFirst( string, 'PHET_LOCALE', locale );
    string = ChipperStringUtils.replaceFirst( string, 'PHET_SIM_TITLE', encoder.htmlEncode( localeTitleAndVersion ) );

    // metadata for Open Graph protocol, see phet-edmodo#2
    string = ChipperStringUtils.replaceFirst( string, 'OG_TITLE', encoder.htmlEncode( localeTitleAndVersion ) );
    string = ChipperStringUtils.replaceFirst( string, 'OG_URL', latestDir + buildConfig.name + '_' + locale + '.html' );
    string = ChipperStringUtils.replaceFirst( string, 'OG_IMAGE', latestDir + buildConfig.name + '-600.png' );

    // TODO: chipper#270 workaround, part 2 (see part 1 in getBuildConfig.js)
    if ( buildConfig.brand === 'phet-io' ) {
      var devVersion = buildConfig.version.replace( '-phet-io', '-dev' );
      string = string.replace( devVersion, buildConfig.version );
    }

    return string;
  }

  // Create locale-specific HTML files
  for ( var i = 0; i < buildConfig.locales.length; i++ ) {
    var locale = buildConfig.locales[ i ];

    var localeHTML = replaceLocaleConstants( html, locale, false );

    // phet-io simulations end in "phetio", see https://github.com/phetsims/together/issues/288
    var brandSuffix = buildConfig.brand === 'phet-io' ? '-phetio' : '';

    // Write the single-file built simulation file
    grunt.file.write( 'build/' + buildConfig.name + '_' + locale + brandSuffix + '.html', localeHTML );

    // Write the Chrome Web Store files
    if ( grunt.option( 'chromeWebStore' ) ) {
      var chromeLocaleHTML = replaceLocaleConstants( chromeHTML, locale, false );
      var localeChipperNamespaceJavascript = replaceLocaleConstants( chipperNamespaceJavascript, locale, false );
      var localeChipperStringSetupJavascript = replaceLocaleConstants( chipperStringSetupJavascript, locale, false );

      var localeDir = 'build/chrome-web-store_' + locale;
      var localeJSDir = localeDir + '/js';
      grunt.file.mkdir( localeDir );
      grunt.file.mkdir( localeJSDir );

      grunt.file.write( localeDir + '/' + buildConfig.name + '_' + locale + '.html', chromeLocaleHTML );
      grunt.file.write( localeJSDir + '/chipper-namespace.js', localeChipperNamespaceJavascript );
      grunt.file.write( localeJSDir + '/chipper-string-setup.js', localeChipperStringSetupJavascript );
      grunt.file.write( localeJSDir + '/mipmaps.js', mipmapsJavaScript );
      grunt.file.write( localeJSDir + '/preload.js', preloadScripts.join( '\n' ) );
      grunt.file.write( localeJSDir + '/main.js', mainInlineJavascript );
    }
  }

  // Create an _all.html file
  if ( grunt.option( 'allHTML' ) && buildConfig.brand === 'phet' ) {
    grunt.file.write( 'build/' + buildConfig.name + '_all.html', replaceLocaleConstants( html, 'en', true ) );
  }

  //TODO should this be using ChipperConstants.FALLBACK_LOCALE instead of hardcoded to 'en'?
  // Create a file for testing iframe embedding.  English (en) is assumed as the locale.
  // phet-io sims should be tested in more powerful wrappers instead of the iframe test.
  if ( buildConfig.brand !== 'phet-io' ) {
    grunt.log.debug( 'Constructing HTML for iframe testing from template' );
    var iframeTestHtml = grunt.file.read( '../chipper/templates/sim-iframe.html' );
    iframeTestHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, 'PHET_SIM_TITLE', encoder.htmlEncode( simTitleAndVersion + ' iframe test' ) );
    iframeTestHtml = ChipperStringUtils.replaceFirst( iframeTestHtml, 'PHET_SIM_URL', buildConfig.name + '_en.html' );
    grunt.file.write( 'build/' + buildConfig.name + '_en-iframe' + '.html', iframeTestHtml );
  }

  grunt.log.debug( 'Cleaning temporary files' );
  grunt.file.delete( 'build/' + buildConfig.name + '.min.js' );

  callback();
};
