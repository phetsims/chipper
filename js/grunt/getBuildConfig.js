// Copyright 2015, University of Colorado Boulder

/**
 * Gets configuration information that is required by the 'build' task.
 * Reads information from multiple places, including:
 *
 * chipper/build.json
 * $HOME/.phet/build-local.json
 * REPO/package.json
 * grunt.options( optionName )
 *
 * All fields are @public (read-only).
 * Fields include:
 *
 * {string} name - name of the repository being built
 * {string} version - version identifier
 * {string} license - license
 * {string} simTitleStringKey - key of the sim's title string
 * {string} requirejsNamespace - the repository's requirejs namespace in config.js, eg AREA_BUILDER
 * {string} brand - brand identifier
 * {string[]} phetLibs - other repositories that are required by the sim
 * {string[]} preload - scripts that need to be preloaded in the .html file, in the order that they will be preloaded
 * {string[]} licenseKeys - keys to licenses in sherpa/lib/license.json, for third-party dependencies
 * {string[]} locales - locales to build
 * {string[]} availableLocales - locales for which translations are available
 * {Object} gruntConfig
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

// built-in node APIs
var assert = require( 'assert' );

// 3rd-party packages
var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // eslint-disable-line require-statement-match

// modules
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
var getVersionForBrand = require( '../../../chipper/js/grunt/getVersionForBrand' );
var getBrand = require( '../../../chipper/js/grunt/getBrand' );

/**
 * @param {Object} grunt - the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

  /**
   * Gets phetLibs, the set of repositories on which the repository being built depends.
   *
   * @param {Object} packageJSON - package.json
   * @param {Object} buildJSON - build.json
   * @param {string} brand
   * @returns {string[]}
   */
  function getPhetLibs( packageJSON, buildJSON, brand ) {

    // start with package.json
    var phetLibs = packageJSON.phet.phetLibs || [];

    // add the repo that's being built
    phetLibs.push( packageJSON.name );

    // add common and brand-specific entries from build.json
    [ 'common', brand ].forEach( function( id ) {
      if ( buildJSON[ id ] && buildJSON[ id ].phetLibs ) {
        phetLibs = phetLibs.concat( buildJSON[ id ].phetLibs );
      }
    } );

    // sort and remove duplicates
    return _.uniq( phetLibs.sort() );
  }

  /**
   * Gets preload, the set of scripts to be preloaded in the .html file.
   * NOTE! Order of the return value is significant, since it corresponds to the order in which scripts will be preloaded.
   *
   * @param {Object} packageJSON - package.json
   * @param {Object} buildJSON - build.json
   * @param {string} brand
   * @returns {string[]}
   */
  function getPreload( packageJSON, buildJSON, brand ) {

    var preload = [];

    // add preloads that are common to all sims, from build.json
    if ( buildJSON.common && buildJSON.common.preload ) {
      preload = preload.concat( buildJSON.common.preload );
    }

    // add sim-specific preloads from package.json
    if ( packageJSON.phet.preload ) {
      preload = preload.concat( packageJSON.phet.preload );
    }

    // add brand-specific preloads from build.json
    if ( buildJSON[ brand ] && buildJSON[ brand ].preload ) {
      preload = preload.concat( buildJSON[ brand ].preload );
    }

    // add brand-specific preloads from package.json
    if ( packageJSON.phet[ brand ] && packageJSON.phet[ brand ].preload ) {
      preload = preload.concat( packageJSON.phet[ brand ].preload );
    }

    // remove duplicates (do NOT sort, order is significant!)
    return _.uniq( preload );
  }

  /**
   * Gets the license keys for sherpa (third-party) libs that are used.
   *
   * @param {Object} packageJSON - package.json
   * @param {Object} buildJSON - build.json
   * @param {string} brand
   * @param {string[]} preload
   * @returns {string[]}
   */
  function getLicenseKeys( packageJSON, buildJSON, brand, preload ) {

    // start with package.json
    var licenseKeys = packageJSON.phet.licenseKeys || [];

    // add common and brand-specific entries from build.json
    [ 'common', brand ].forEach( function( id ) {
      if ( buildJSON[ id ] && buildJSON[ id ].licenseKeys ) {
        licenseKeys = licenseKeys.concat( buildJSON[ id ].licenseKeys );
      }
    } );

    // Extract keys from preload for sherpa (third-party) dependencies
    preload.forEach( function( path ) {
      if ( path.indexOf( '/sherpa/' ) !== -1 ) {
        var lastSlash = path.lastIndexOf( '/' );
        var key = path.substring( lastSlash + 1 );
        licenseKeys.push( key );
      }
    } );

    // sort and remove duplicates
    return _.uniq( _.sortBy( licenseKeys, function( key ) { return key.toUpperCase(); } ) );
  }

  /*
   * Gets the locales from a repository, by inspecting the names of the string files in babel for that repository.
   *
   * @param {string} repository - name of the repository to get locales from
   */
  function getLocalesFromRepository( repository ) {

    // confirm that the repository has a strings directory
    var stringsDirectory = '../babel/' + repository;
    assert( grunt.file.isDir(), stringsDirectory + 'is not a directory' );

    // Get names of string files.
    var stringFiles = grunt.file.expand( stringsDirectory + '/' + repository + '-strings_*.json' );

    // Don't fail out if there are no string files, as this is a normal condition when building new simulations
    if ( stringFiles.length === 0 ) {
      grunt.log.debug( 'No string files found in ' + stringsDirectory + ' for repository ' + repository );
      return [];
    }

    // Extract the locales from the file names.
    // File names must have a form like 'graphing-lines-strings_ar_SA.json', where no '_' appear in the repo name.
    var locales = stringFiles.map( function( filename ) {
      return filename.substring( filename.indexOf( '_' ) + 1, filename.lastIndexOf( '.' ) );
    } );
    assert( locales.length > 0, 'no locales found in ' + stringsDirectory );

    return locales;
  }

  /**
   * Gets the set of locales to be built.
   *
   * The grunt options are:
   *
   * --locales=* : all locales from the repo's strings/ directory
   * --locales=fr : French
   * --locales=ar,fr,es : Arabic, French and Spanish (comma-separated locales)
   * --localesRepo=beers-law-lab: all locales from another repository's strings/ directory, ignored if --locales is specified
   *
   * @param {Object} grunt - the grunt instance
   * @param {string} repository - name of the repository that is being built
   */
  function getLocales( grunt, repository ) {

    var locales = [ ChipperConstants.FALLBACK_LOCALE ];
    var localesValue = grunt.option( 'locales' );

    if ( localesValue ) {
      if ( localesValue === '*' ) {
        locales = locales.concat( getLocalesFromRepository( repository ) ); // all locales for the repository that we're building
      }
      else {
        // use only the specified locales, which may not include the fallback
        locales = localesValue.split( ',' );
      }
    }
    else {
      var localesRepo = grunt.option( 'localesRepo' );
      if ( localesRepo ) {
        locales = locales.concat( getLocalesFromRepository( localesRepo ) ); // all locales for some other repository
      }
    }

    return _.uniq( locales.sort() );
  }

  /**
   * Verifies that preload repositories are included in phetLib.
   *
   * @param {string[]} preload
   * @param {string[]} phetLibs
   */
  function validatePreload( preload, phetLibs ) {
    var missingRepositories = [];
    preload.forEach( function( entry ) {

      // preload entries should start with '..', e.g. "../assert/js/assert.js"
      assert( entry.split( '/' )[ 0 ] === '..', 'malformed preload entry: ' + entry );

      // the preload's repository should be in phetLib
      var repositoryName = entry.split( '/' )[ 1 ];
      if ( phetLibs.indexOf( repositoryName ) === -1 && missingRepositories.indexOf( repositoryName ) === -1 ) {
        missingRepositories.push( repositoryName );
      }
    } );
    assert( missingRepositories.length === 0,
      'phetLib is missing repositories required by preload: ' + missingRepositories.toString() );
  }

  //------------------------------------------------------------------------------------
  // read configuration files

  // ./package.json (required)
  var PACKAGE_FILENAME = 'package.json';
  var packageJSON = grunt.file.readJSON( PACKAGE_FILENAME );
  assert( packageJSON.name, 'name missing from ' + PACKAGE_FILENAME );
  assert( packageJSON.version, 'version missing from ' + PACKAGE_FILENAME );
  assert( packageJSON.license, 'license missing from ' + PACKAGE_FILENAME );

  // only repositories that are runnable have PhET-specific entries
  if ( packageJSON.phet ) {

    // verify that required fields are present
    assert( packageJSON.phet.requirejsNamespace, 'phet.requirejsNamespace missing from ' + PACKAGE_FILENAME );
  }
  else {

    // default so that non-build tasks run for repositories that aren't runnable
    packageJSON.phet = {};
  }

  // chipper/build.json (required)
  var buildJSON = grunt.file.readJSON( '../chipper/build.json' );

  // $HOME/.phet/build-local.json (optional)
  var buildLocalJSON;
  try {
    buildLocalJSON = grunt.file.readJSON( process.env.HOME + '/.phet/build-local.json' );
  }
  catch( error ) {
    buildLocalJSON = {};
  }

  //------------------------------------------------------------------------------------
  // Assemble the buildConfig
  var brand = getBrand( grunt, buildLocalJSON );
  var buildConfig = {

    // These fields have no dependencies on other entries in buildConfig.
    name: packageJSON.name,
    version: getVersionForBrand( brand, packageJSON.version ),
    license: packageJSON.license,
    requirejsNamespace: packageJSON.phet.requirejsNamespace,

    // @public (read-write, phetIO)
    brand: brand,

    //TODO: better way to allow requesting different preload lists? chipper#63
    getPreload: getPreload // for generating HTML files for specific configurations, see chipper#63
  };

  // These fields depend on other entries in buildConfig.
  buildConfig.simTitleStringKey = buildConfig.requirejsNamespace + '/' + buildConfig.name + '.title'; // REPO/repo.name
  buildConfig.phetLibs = getPhetLibs( packageJSON, buildJSON, buildConfig.brand );
  buildConfig.preload = getPreload( packageJSON, buildJSON, buildConfig.brand );
  validatePreload( buildConfig.preload, buildConfig.phetLibs );
  buildConfig.licenseKeys = getLicenseKeys( packageJSON, buildJSON, buildConfig.brand, buildConfig.preload );
  buildConfig.locales = getLocales( grunt, buildConfig.name );
  buildConfig.availableLocales = [ ChipperConstants.FALLBACK_LOCALE ].concat( getLocalesFromRepository( buildConfig.name ) );

  grunt.log.debug( 'buildConfig=' + JSON.stringify( buildConfig, null, 2 ) );
  return buildConfig;
};
