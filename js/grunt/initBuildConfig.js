// Copyright 2002-2015, University of Colorado Boulder

/**
 * Initializes configuration information that is required by the 'build' task.
 * Reads information from multiple places, including:
 *
 * chipper/build.json
 * $HOME/.phet/build-local.json
 * REPO/package.json
 * grunt.options( optionName )
 *
 * The information is shared via global variable global.phet.chipper.buildConfig.
 * All entries are @public (read-only).
 * Entries include:
 *
 * {string} name - name of the repository being built
 * {string} version - version identifier
 * {string} license - license
 * {string} simTitleStringKey - key of the sim's title string
 * {string} brand - brand identifier
 * {string[]} phetLibs - other repositories that are required by the sim
 * {string[]} preload - scripts that need to be preloaded in the .html file, in the order that they will be preloaded
 * {string[]} licenseKeys - keys to licenses in sherpa/lib/license.json, for third-party dependencies
 * {string} fallbackLocale - the locale to use if none is specified
 * {string[]} locales - locales to build
 * {Object} gruntConfig
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

// The following comment permits node-specific globals (such as process.cwd()) to pass jshint
/* jslint node: true */
'use strict';

// built-in node APIs
var assert = require( 'assert' );
var fs = require( 'fs' );

/**
 * @param {Object} grunt - the grunt instance
 */
module.exports = function( grunt ) {

  var buildConfig = {};

  //------------------------------------------------------------------------------------
  // read configuration information from various sources

  // ./package.json (required)
  var PACKAGE_FILENAME = 'package.json';
  assert( fs.existsSync( PACKAGE_FILENAME ), 'missing ' + PACKAGE_FILENAME );
  var packageJSON = grunt.file.readJSON( PACKAGE_FILENAME );

  // chipper/build.json (required)
  var BUILD_FILENAME = '../chipper/build.json';
  assert( fs.existsSync( BUILD_FILENAME ), 'missing ' + BUILD_FILENAME );
  var buildJSON = grunt.file.readJSON( BUILD_FILENAME );

  // $HOME/.phet/build-local.json (optional)
  var BUILD_LOCAL_FILENAME = process.env.HOME + '/.phet/build-local.json';
  var buildLocalJSON = {};
  if ( fs.existsSync( BUILD_LOCAL_FILENAME ) ) {
    buildLocalJSON = grunt.file.readJSON( BUILD_LOCAL_FILENAME );
  }

  // grunt.options (all optional)
  var gruntOptions = {
    brand: grunt.option( 'brand' ), // {string} brand name
    locales: grunt.option( 'locales' ), // {string[]} locales to build
    localesRepo: grunt.option( 'localeRepos' ) // {string} repo to get list of locales from, ignored if 'locales' is specified
  };

  //------------------------------------------------------------------------------------
  // standard entries in package.json

  assert( packageJSON.name, 'name missing from ' + PACKAGE_FILENAME );
  buildConfig.name = packageJSON.name;
  assert( packageJSON.version, 'version missing from ' + PACKAGE_FILENAME );
  buildConfig.version = packageJSON.version;
  assert( packageJSON.license, 'license missing from ' + PACKAGE_FILENAME );
  buildConfig.license = packageJSON.license;

  //------------------------------------------------------------------------------------
  // PhET-specific entries in package.json

  buildConfig.simTitleStringKey = packageJSON.simTitleStringKey;

  //------------------------------------------------------------------------------------
  // brand

  buildConfig.brand = gruntOptions.brand || buildLocalJSON.brand || 'adapted-from-phet';

  //------------------------------------------------------------------------------------
  // phetLibs

  // package.json
  var phetLibs = packageJSON.phet.phetLibs || [];

  // the repo that's being built
  phetLibs.push( packageJSON.name );

  // build.json
  [ 'common', buildConfig.brand ].forEach( function( id ) {
    if ( buildJSON[ id ] && buildJSON[ id ].phetLibs ) {
      phetLibs = phetLibs.concat( buildJSON[ id ].phetLibs );
    }
  } );

  // sort and remove duplicates
  phetLibs = _.uniq( phetLibs.sort() );

  buildConfig.phetLibs = phetLibs;

  //------------------------------------------------------------------------------------
  // preload

  // NOTE! Order is important here, since it determines the order in which scripts will be preloaded.

  // package.json
  var preload = [];

  // common entry in build.json
  if ( buildJSON.common && buildJSON.common.preload ) {
    preload = preload.concat( buildJSON.common.preload );
  }

  // package.json
  if ( packageJSON.preload ) {
    preload = preload.concat( packageJSON.preload );
  }

  // brand-specific entry in build.json
  if ( buildJSON[ buildConfig.brand ] && buildJSON[ buildConfig.brand ].preload ) {
    preload = preload.concat( buildJSON[ buildConfig.brand ].preload );
  }

  // together API file
  if ( buildConfig.brand === 'phet-io' ) {
    preload = preload.concat( buildJSON[ 'phet-io' ].preload );
    var TOGETHER_API_FILENAME = '../together/js/api/' + packageJSON.name + '-api.js';
    assert( fs.existsSync( TOGETHER_API_FILENAME ), 'together API file does not exist: ' + TOGETHER_API_FILENAME );
    preload.push( TOGETHER_API_FILENAME );
  }

  // sort and remove duplicates
  buildConfig.preload = _.uniq( preload.sort() );

  //------------------------------------------------------------------------------------
  // licenseKeys

  // package.json
  var licenseKeys = packageJSON.phet.licenseKeys || [];

  // build.json
  [ 'common', buildConfig.brand ].forEach( function( id ) {
    if ( buildJSON[ id ] && buildJSON[ id ].licenseKeys ) {
      licenseKeys = licenseKeys.concat( buildJSON[ id ].licenseKeys );
    }
  } );

  // Extract keys from preload for sherpa (third-party) dependencies
  buildConfig.preload.forEach( function( path ) {
    if ( path.indexOf( '/sherpa/' ) !== -1 ) {
      var lastSlash = path.lastIndexOf( '/' );
      var key = path.substring( lastSlash + 1 );
      licenseKeys.push( key );
    }
  } );

   // sort and remove duplicates
  buildConfig.licenseKeys = _.uniq( _.sortBy( licenseKeys, function( key ) { return key.toUpperCase(); } ) );

  //------------------------------------------------------------------------------------
  // locales

  buildConfig.fallbackLocale = 'en';

  /*
   * Look up the locale strings provided by a specified repository.
   * Requires a form like energy-skate-park-basics_ar_SA, where no _ appear in the sim name.
   *
   * @param {string} localeRepo - name of the repo to get locales from
   * @param {string} fallback locale - the locale to use when no locale is specified
   */
  function getLocalesForRepo( localeRepo, fallbackLocale ) {

    // confirm that localeRepo is a directory
    var stringsDirectory = '../babel/' + localeRepo;
    var stats = fs.statSync( stringsDirectory );
    assert( stats.isDirectory(), stringsDirectory + 'is not a directory' );

    // get names of string files
    var stringFiles = fs.readdirSync( stringsDirectory ).filter( function( filename ) {
      return (/^.*-strings.*\.json/).test( filename );
    } );
    assert( stringFiles.length > 0, 'no string files found in ' + stringsDirectory );

    // extract the locales from the file names
    var locales = stringFiles.map( function( filename ) {
      return filename.substring( filename.indexOf( '_' ) + 1, filename.lastIndexOf( '.' ) );
    } );
    assert( locales.length > 0, 'no locales found in ' + stringsDirectory );

    return locales;
  }

  /*
   * Grunt options determine which locales to build.
   * With no options, builds the fallback locale.
   *
   * --locales=* : all locales from the repo's strings/ directory
   * --locales=fr : French
   * --locales=ar,fr,es : Arabic, French and Spanish (comma-separated locales)
   * --localesRepo=beers-law-lab: all locales from another repository's strings/ directory, ignored if --locales is specified
   */
  if ( gruntOptions.locales ) {
    if ( gruntOptions.locales === '*' ) {
      buildConfig.locales = getLocalesForRepo( buildConfig.name ); // all locales for this repo
    }
    else {
      buildConfig.locales = _.uniq( gruntOptions.locales.split( ',' ) );
    }
  }
  else if ( gruntOptions.localesRepo ) {
    buildConfig.locales = getLocalesForRepo( gruntOptions.localesRepo ); // all locales for some other repo
  }
  else {
    buildConfig.locales = [ buildConfig.fallbackLocale ];
  }

  //------------------------------------------------------------------------------------
  // lint

  // Repository files to be linted. brand has a non-standard directory structure.
  var repoFilesToLint = ( packageJSON.name === 'brand' ) ? [ '*/js/**/*.js' ] : [ 'js/**/*.js' ];

  // All files to be linted
  var allFilesToLint = _.map( packageJSON.phet.phetLibs, function( repo ) {
    return '../' + repo + '/js/**/*.js';
  } );

  // brand repo has a non-standard directory structure, so add it explicitly if it's a dependency.
  if ( packageJSON.name !== 'brand' ) {
    allFilesToLint.push( '../brand/*/js/**/*.js' );
  }

  // Don't try to lint svgPath.js. It was automatically generated and doesn't match convention.
  allFilesToLint.push( '!../kite/js/parser/svgPath.js' );
  allFilesToLint = _.uniq( allFilesToLint );

  var jshintConfig = {

    // source files that are specific to this repository
    repoFiles: repoFilesToLint,

    // All source files for this repository (repository-specific and dependencies).
    // Excludes kite/js/parser/svgPath.js, which is auto-generated.
    allFiles: allFilesToLint,

    // reference external JSHint options in jshintOptions.js
    options: require( './jshintOptions' )
  };

  //------------------------------------------------------------------------------------
  // grunt config

  buildConfig.gruntConfig = {

    //TODO is this going to work here?
    // Setting pkg allows us to refer to package.json entries from within this config
    pkg: packageJSON,

    jshint: jshintConfig,

    // configure the RequireJS plugin
    requirejs: {

      // builds the minified script
      build: {

        options: {

          almond: true,
          mainConfigFile: 'js/<%= pkg.name %>-config.js',
          out: 'build/<%= pkg.name %>.min.js',
          name: '<%= pkg.name %>-config',

          // Minification strategy.  Put this to none if you want to debug a non-minified but compiled version
          optimize: 'uglify2',
          wrap: true,
          // generateSourceMaps: true, //#42 commented out this line until source maps are fixed
          preserveLicenseComments: false,
          uglify2: {
            output: {
              inline_script: true // escape </script
            },
            compress: {
              global_defs: {
                // global assertions
                assert: false,
                assertSlow: false,
                // scenery logging
                sceneryLog: false,
                sceneryLayerLog: false,
                sceneryEventLog: false,
                sceneryAccessibilityLog: false,
                phetAllocation: false
              },
              dead_code: true
            }
          },

          // stub out the plugins so their source code won't be included in the minified file
          stubModules: [ 'string', 'audio', 'image' ]
        }
      }
    }
  };

  //------------------------------------------------------------------------------------
  // Share via global

  global.phet = global.phet || {};
  global.phet.chipper = global.phet.chipper || {};
  global.phet.chipper.buildConfig = buildConfig;
  grunt.log.debug( 'global.phet.chipper.buildConfig=' + JSON.stringify( global.phet.chipper.buildConfig ) );
};
