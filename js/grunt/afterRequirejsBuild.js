// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task does things after the requirejs:build step.
 * It is for internal use only, not intended to be called directly.
 */

// built-in node APIs
var assert = require( 'assert' );
var fs = require( 'fs' );
var path = require( 'path' );
var child_process = require( 'child_process' );

/* jshint -W079 */
var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
/* jshint +W079 */

// Mipmap setup
var createMipmap = require( '../../../chipper/js/grunt/createMipmap' );

// Loading files as data URIs
var loadFileAsDataURI = require( '../../../chipper/js/common/loadFileAsDataURI' );

var localeInfo = require( '../../../chipper/js/data/localeInfo' ); // Locale information
var reportUnusedMedia = require( '../../../chipper/js/grunt/reportUnusedMedia' );
var getThirdPartyLibEntries = require( '../../../chipper/js/grunt/getThirdPartyLibEntries' );

// Load shared constants
var ThirdPartyConstants = require( '../../../chipper/js/grunt/ThirdPartyConstants' );

/**
 * @param grunt the grunt instance
 * @param {Object} pkg package.json
 * @param {string} fallbackLocale
 */
module.exports = function( grunt, pkg, fallbackLocale ) {
  'use strict';

  // required fields in package.json
  assert( pkg.name, 'name missing from package.json' );
  assert( pkg.version, 'version missing from package.json' );
  assert( pkg.license, 'license missing from package.json' );
  assert( pkg.requirejsNamespace, 'requirejsNamespace missing from package.json' );
  assert( pkg.simTitleStringKey, 'simTitleStringKey missing from package.json' );
  assert( pkg.phetLibs, 'phetLibs missing from package.json' );

  // required fields in pkg (package.json augmented in setPreload)
  assert( pkg.preload, 'preload missing from pkg' );

  // globals that should be defined by this point
  assert( global.phet, 'missing global.phet' );
  assert( global.phet.strings, 'missing global.phet.strings' );
  assert( global.phet.localesToBuild, 'missing global.phet.localesToBuild' );
  assert( global.phet.mipmapsToBuild, 'missing global.phet.mipmapsToBuild' );
  assert( global.phet.chipper, 'missing global.phet.chipper' );
  assert( global.phet.chipper.brand, 'missing global.phet.chipper.brand' );

  function trimWhitespace( str ) {
    return str.replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' );
  }

  function padString( str, n ) {
    while ( str.length < n ) {
      str += ' ';
    }
    return str;
  }

  // Replaces the first occurrence of substring in str with replacement.
  function replaceFirst( str, substring, replacement ) {
    var idx = str.indexOf( substring );
    if ( str.indexOf( substring ) !== -1 ) {
      return str.slice( 0, idx ) + replacement + str.slice( idx + substring.length );
    }
    else {
      return str;
    }
  }

  /**
   * Returns a map such that map[locale][stringKey] will be the string value (with fallbacks to English where needed).
   * Loads each string file only once, and only loads the repository/locale combinations necessary.
   */
  function loadStringMap() {
    var locales = global.phet.localesToBuild;
    var localesWithFallback = ( locales.indexOf( fallbackLocale ) < 0 ) ? locales.concat( [ fallbackLocale ] ) : locales;

    // Get metadata of repositories that we want to load strings from (that were referenced in the sim)
    var stringRepositories = []; // { name: {string}, path: {string}, requirejsNamespace: {string} }
    for ( var stringKey in global.phet.strings ) {
      var repositoryName = global.phet.strings[ stringKey ].repositoryName;

      if ( stringRepositories.every( function( repo ) { return repo.name !== repositoryName; } ) ) {
        stringRepositories.push( {
          name: repositoryName,
          path: global.phet.strings[ stringKey ].repositoryPath,
          requirejsNamespace: global.phet.strings[ stringKey ].requirejsNamespace
        } );

        // If a string depends on an unlisted dependency, fail out
        if ( pkg.phetLibs.indexOf( repositoryName ) < 0 ) {
          throw new Error( repositoryName + ' is missing from phetLib in package.json' );
        }
      }
    }

    // Load all the required string files into memory, so we don't load them multiple times (for each usage)
    var repoStringMap = {}; // maps [repositoryName][locale] => contents of locale string file
    stringRepositories.forEach( function( repository ) {
      repoStringMap[ repository.name ] = {};

      localesWithFallback.forEach( function( locale ) {

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

        var stringsFilename = path.normalize( basePath + repository.name + '-strings_' + locale + '.json' );

        var fileExists = fs.existsSync( stringsFilename );
        if ( fileExists ) {
          var fileContents = JSON.parse( fs.readFileSync( stringsFilename, 'utf8' ) );
          var fileMap = repoStringMap[ repository.name ][ locale ] = {};

          for ( var stringKeyMissingPrefix in fileContents ) {
            var stringData = fileContents[ stringKeyMissingPrefix ];

            // Pad LTR/RTL language values with unicode embedding marks (see https://github.com/phetsims/joist/issues/152)
            // Uses directional formatting characters: http://unicode.org/reports/tr9/#Directional_Formatting_Characters
            stringData.value = ( isRTL ? '\u202b' : '\u202a' ) + stringData.value + '\u202c';

            // Add the requirejs namespaces (eg, JOIST) to the key
            fileMap[ repository.requirejsNamespace + '/' + stringKeyMissingPrefix ] = fileContents[ stringKeyMissingPrefix ];
          }
        }
        else {
          grunt.log.error( 'Missing ' + stringsFilename );
        }
      } );
    } );

    // combine our strings into [locale][stringKey] map, using the fallback locale where necessary
    var stringMap = {};
    localesWithFallback.forEach( function( locale ) {
      stringMap[ locale ] = {};

      for ( var stringKey in global.phet.strings ) {
        var repositoryName = global.phet.strings[ stringKey ].repositoryName;

        // English fallback
        assert( repoStringMap[ repositoryName ][ fallbackLocale ][ stringKey ] !== undefined,
          'Missing string: ' + stringKey + ' in ' + repositoryName + ' for fallback locale: ' + fallbackLocale );
        var fallbackString = repoStringMap[ repositoryName ][ fallbackLocale ][ stringKey ].value;
        stringMap[ locale ][ stringKey ] = fallbackString;

        // Extract 'value' field from non-fallback (babel) strings file, and overwrites the default if available.
        if ( locale !== fallbackLocale &&
             repoStringMap[ repositoryName ] &&
             repoStringMap[ repositoryName ][ locale ] &&
             repoStringMap[ repositoryName ][ locale ][ stringKey ] ) {
          stringMap[ locale ][ stringKey ] = repoStringMap[ repositoryName ][ locale ][ stringKey ].value;
        }
      }
    } );

    return stringMap;
  }

  // TODO: chipper#101 eek, this is scary! we are importing from the repository dir. ideally we should just have uglify-js installed once in chipper?
  var uglify = require( '../../../' + pkg.name + '/node_modules/uglify-js' );

  var done = grunt.task.current.async();

  grunt.log.debug( 'Minifying preload scripts' );
  var preloadBlocks = '';
  for ( var libIdx = 0; libIdx < pkg.preload.length; libIdx++ ) {
    var lib = pkg.preload[ libIdx ];
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

  var dependencies = _.clone( pkg.phetLibs ); // clone because we'll be modifying this array
  var dependencyInfo = {
    comment: '# ' + pkg.name + ' ' + pkg.version + ' ' + (new Date().toString())
  };

  function postMipmapLoad( dependencyJSON, mipmapJavascript ) {

    // After all plugins completed, check which media files (images & audio files) are in the media
    // directories but not loaded by the plugins.
    reportUnusedMedia( grunt, pkg.requirejsNamespace );

    // Load the splash SVG from the appropriate brand.
    var splashDataURI = loadFileAsDataURI( '../brand/' + global.phet.chipper.brand + '/images/splash.svg' );
    var mainInlineJavascript = grunt.file.read( 'build/' + pkg.name + '.min.js' );

    // Create the license header for this html and all the 3rd party dependencies
    // Text was discussed in https://github.com/phetsims/chipper/issues/148
    var titleKey = pkg.simTitleStringKey;
    var stringMap = loadStringMap();

    // Make sure the simulation has a title
    if ( !stringMap.en[ titleKey ] ) {
      grunt.fail.warn( 'There was no title.' );
    }

    // Get the title to display as the sim name and version.  The HTML header is not internationalized, so word order
    // can just be hard coded as English here, see #156
    var englishSimTitle = stringMap.en[ titleKey ] + ' ' + pkg.version;

    // Select the HTML comment header based on the brand, see https://github.com/phetsims/chipper/issues/156
    var htmlHeader = null;
    if ( global.phet.chipper.brand === 'phet-io' ) {

      // License text provided by @kathy-phet in https://github.com/phetsims/chipper/issues/148#issuecomment-112584773
      htmlHeader = englishSimTitle + '\n' +
                   'Copyright 2002-' + grunt.template.today( 'yyyy' ) + ', Regents of the University of Colorado\n' +
                   'PhET Interactive Simulations, University of Colorado Boulder\n' +
                   '\n' +
                   'This Interoperable PhET Simulation file requires a license.\n' +
                   'USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' +
                   'Contact phethelp@colorado.edu regarding licensing.\n' +
                   'http://phet.colorado.edu/en/licensing';
    }
    else {
      htmlHeader = englishSimTitle + '\n' +
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

    // workaround for Uglify2's unicode unescaping. see https://github.com/phetsims/chipper/issues/70
    preloadBlocks = preloadBlocks.replace( '\x0B', '\\x0B' );
    mainInlineJavascript = mainInlineJavascript.replace( '\x0B', '\\x0B' );

    grunt.log.debug( 'Constructing HTML from template' );
    var html = grunt.file.read( '../chipper/templates/sim.html' );
    // Strip out carriage returns (if building in Windows), then add in our own after the MOTW.
    // See https://github.com/phetsims/joist/issues/164
    html = replaceFirst( html.replace( /\r/g, '' ), 'CARRIAGE_RETURN', '\r' );
    html = replaceFirst( html, 'HTML_HEADER', htmlHeader );
    html = replaceFirst( html, 'PHET_MIPMAPS_JAVASCRIPT', mipmapJavascript );
    html = replaceFirst( html, 'SPLASH_SCREEN_DATA_URI', splashDataURI );
    html = replaceFirst( html, 'PRELOAD_INLINE_JAVASCRIPT', preloadBlocks );
    html = replaceFirst( html, 'MAIN_INLINE_JAVASCRIPT', '<script type="text/javascript">' + mainInlineJavascript + '</script>' );
    html = replaceFirst( html, 'START_THIRD_PARTY_LICENSE_ENTRIES', ThirdPartyConstants.START_THIRD_PARTY_LICENSE_ENTRIES );
    html = replaceFirst( html, 'END_THIRD_PARTY_LICENSE_ENTRIES', ThirdPartyConstants.END_THIRD_PARTY_LICENSE_ENTRIES );

    grunt.log.debug( 'Writing HTML' );

    // Create the translated versions

    var locales = global.phet.localesToBuild;

    // Write the stringless template in case we want to use it with the translation addition process.
    // Skip it if only building one HTML.
    if ( locales.length > 1 ) {
      grunt.file.write( 'build/' + pkg.name + '_STRING_TEMPLATE.html', html );
    }

    html = replaceFirst( html, 'PHET_SHAS', dependencyJSON );

    // Start aggregating all of the 3rd party license entries
    var thirdPartyEntries = {
      lib: getThirdPartyLibEntries( grunt, pkg )
    };

    // Add a list of all 3rd-party media files, such as images and audio.
    // For each registered image or audio file, keep the ones that are not from PhET
    // return their licenseInfo.entry
    // For each media type
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
              if ( global.phet.chipper.brand === 'phet' || global.phet.chipper.brand === 'phet-io' ) {
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
    html = replaceFirst( html, 'THIRD_PARTY_LICENSE_ENTRIES', JSON.stringify( thirdPartyEntries, null, 2 ) );

    for ( var i = 0; i < locales.length; i++ ) {
      var locale = locales[ i ];

      var localeHTML = replaceFirst( html, 'PHET_STRINGS', JSON.stringify( stringMap[ locale ], null, '' ) );

      var timestamp = new Date().toISOString().split( 'T' ).join( ' ' );
      timestamp = timestamp.substring( 0, timestamp.indexOf( '.' ) ) + ' UTC';

      //TODO: if this is for changing layout, we'll need these globals in requirejs mode
      //TODO: why are we combining pkg.name with pkg.version?
      //Make the locale accessible at runtime (e.g., for changing layout based on RTL languages), see #40
      localeHTML = replaceFirst( localeHTML, 'PHET_PROJECT', pkg.name );
      localeHTML = replaceFirst( localeHTML, 'PHET_VERSION', pkg.version );
      localeHTML = replaceFirst( localeHTML, 'PHET_BUILD_TIMESTAMP', timestamp );
      localeHTML = replaceFirst( localeHTML, 'PHET_LOCALE', locale );

      // TODO: As a temporary means of keeping track of "together" versions, replace "-dev" with "-together" in the
      // version string. This approach has a lot of problems and should be replaced as soon as we work out a more all
      // encompassing way of tracking together-enhanced versions.  See https://github.com/phetsims/special-ops/issues/3
      // for more info.
      if ( global.phet.chipper.brand === 'phet-io' ) {
        var unalteredVersion = pkg.version.replace( '-together', '-dev' );
        localeHTML = replaceFirst( localeHTML, unalteredVersion, pkg.version );
      }

      assert( pkg.simTitleStringKey, 'simTitleStringKey missing from package.json' ); // required for sims
      localeHTML = replaceFirst( localeHTML, 'SIM_TITLE', stringMap[ locale ][ titleKey ] + ' ' + pkg.version ); //TODO: i18n order
      grunt.file.write( 'build/' + pkg.name + '_' + locale + '.html', localeHTML );
    }

    // Create a file for testing iframe embedding.  English (en) is assumed as the locale.
    grunt.log.debug( 'Constructing HTML for iframe testing from template' );
    var iframeTestHtml = grunt.file.read( '../chipper/templates/sim-iframe.html' );
    iframeTestHtml = replaceFirst( iframeTestHtml, 'SIM_TITLE', stringMap[ fallbackLocale ][ titleKey ] + ' ' + pkg.version + ' iframe test' );
    iframeTestHtml = replaceFirst( iframeTestHtml, 'SIM_URL', pkg.name + '_en.html' );

    // Write the iframe test file.  English (en) is assumed as the locale.
    grunt.log.debug( 'Writing HTML for iframe testing' );
    grunt.file.write( 'build/' + pkg.name + '_en-iframe' + '.html', iframeTestHtml );

    // Write the string map, which may be used by translation utility for showing which strings are available for translation
    var stringMapFilename = 'build/' + pkg.name + '_string-map.json';
    grunt.log.debug( 'Writing string map to ', stringMapFilename );
    grunt.file.write( stringMapFilename, JSON.stringify( stringMap[ fallbackLocale ], null, '\t' ) );

    grunt.log.debug( 'Cleaning temporary files' );
    grunt.file.delete( 'build/' + pkg.name + '.min.js' );

    done();
  }

  // git --git-dir ../scenery/.git rev-parse HEAD                 -- sha
  // git --git-dir ../scenery/.git rev-parse --abbrev-ref HEAD    -- branch
  function nextDependency() {
    if ( dependencies.length ) {
      var dependency = dependencies.shift(); // remove first item
      assert( !dependencyInfo.dependency, 'there was already a dependency named ' + dependency );

      // get the SHA
      child_process.exec( 'git --git-dir ../' + dependency + '/.git rev-parse HEAD', function( error, stdout, stderr ) {
        assert( !error, error ? ( 'ERROR on git SHA attempt: code: ' + error.code + ', signal: ' + error.signal + ' with stderr:\n' + stderr ) : 'An error without an error? not good' );

        var sha = trimWhitespace( stdout );

        // get the branch
        child_process.exec( 'git --git-dir ../' + dependency + '/.git rev-parse --abbrev-ref HEAD', function( error, stdout, stderr ) {
          assert( !error, error ? ( 'ERROR on git branch attempt: code: ' + error.code + ', signal: ' + error.signal + ' with stderr:\n' + stderr ) : 'An error without an error? not good' );

          var branch = trimWhitespace( stdout );

          grunt.log.debug( padString( dependency, 20 ) + branch + ' ' + sha );
          dependencyInfo[ dependency ] = { sha: sha, branch: branch };

          nextDependency();
        } );
      } );
    }
    else {
      // now continue on with the process! CALLBACK SOUP FOR YOU!

      // get our JSON for dependencies
      var dependencyJSON = JSON.stringify( dependencyInfo, null, 2 );

      // and get JSON for our dependences (without babel), for dependencies.json
      // (since different builds can have different babel SHAs)
      var dependencyInfoWithoutBabel = {};
      for ( var key in dependencyInfo ) {
        if ( key !== 'babel' ) {
          dependencyInfoWithoutBabel[ key ] = dependencyInfo[ key ];
        }
      }
      var dependencyJSONWithoutBabel = JSON.stringify( dependencyInfoWithoutBabel, null, 2 );

      grunt.log.debug( 'Writing dependencies.json' );
      grunt.file.write( 'build/dependencies.json', dependencyJSONWithoutBabel + '\n' );

      // need to load mipmaps here, since we can't do it synchronously during the require.js build step
      var mipmapsLoaded = 0; // counter that indicates we are done when incremented to the number of mipmaps
      var mipmapResult = {}; // result to be attached to window.phet.chipper.mipmaps in the sim
      if ( global.phet.mipmapsToBuild.length ) {
        global.phet.mipmapsToBuild.forEach( function( mipmapToBuild ) {
          var name = mipmapToBuild.name;
          var path = mipmapToBuild.path;
          var level = mipmapToBuild.level;
          var quality = mipmapToBuild.quality;

          createMipmap( path, level, quality, grunt, function( mipmaps ) {
            mipmapToBuild.mipmaps = mipmaps;
            mipmapResult[ name ] = mipmaps.map( function( mipmap ) {
              return {
                width: mipmap.width,
                height: mipmap.height,
                url: mipmap.url
              };
            } );
            mipmapsLoaded++;

            if ( mipmapsLoaded === global.phet.mipmapsToBuild.length ) {

              // we've now finished loading all of the mipmaps, and can proceed with the build
              var mipmapsJavaScript = '<script type="text/javascript">window.phet.chipper.mipmaps = ' + JSON.stringify( mipmapResult ) + ';</script>';
              postMipmapLoad( dependencyJSON, mipmapsJavaScript );
            }
          } );
        } );
      }
      else {
        postMipmapLoad( dependencyJSON, '<!-- no mipmaps -->' ); // no mipmaps loaded
      }
    }
  }

  grunt.log.debug( 'Scanning dependencies from:\n' + dependencies.toString() );
  nextDependency();
};
