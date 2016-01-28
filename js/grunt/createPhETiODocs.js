// Copyright 2015, University of Colorado Boulder

/**
 * Copy a simulation and its API to the local phet-io-site, see phet-io-site-readme.md
 *
 * @author Sam Reid
 */

// modules
var assert = require( 'assert' );

// constants
var directory = process.cwd();

/**
 * @param grunt the grunt instance
 * @param buildConfig
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  var simVersion = buildConfig.version;

  assert( grunt.option( 'siteversion' ), '--siteversion must be specified' );

  var siteVersion = grunt.option( 'siteversion' ) + ''; // convert number to string

  if ( siteVersion.indexOf( '.' ) < 0 ) {
    siteVersion = siteVersion + '.0'; // Drop missing ".0" suffix if missing
  }

  var assetsPath = directory + '/../phet-io-site/' + siteVersion + '/assets/' + simVersion;
  var demosPath = directory + '/../phet-io-site/' + siteVersion + '/demos/' + simVersion;
  var devguidePath = directory + '/../phet-io-site/' + siteVersion + '/devguide/' + simVersion;

  // Clean if present
  if ( grunt.file.exists( assetsPath ) ) {
    grunt.file.delete( assetsPath, { force: true } ); // Must force since it is outside of working directory
  }
  if ( grunt.file.exists( demosPath ) ) {
    grunt.file.delete( demosPath, { force: true } );
  }
  if ( grunt.file.exists( devguidePath ) ) {
    grunt.file.delete( devguidePath, { force: true } );
  }

  // Create
  grunt.file.mkdir( assetsPath );
  grunt.file.mkdir( demosPath );
  grunt.file.mkdir( devguidePath );

  // Copy built sim files (assuming they exist from a prior grunt command)
  grunt.file.recurse( directory + '/phet-io-site/assets', function callback( abspath, rootdir, subdir, filename ) {

    // TODO: this line is duplicated around chipper
    var targetPath = subdir ? ( assetsPath + '/' + subdir + '/' + filename ) : ( assetsPath + '/' + filename );
    grunt.file.copy( abspath, targetPath );
  } );

  grunt.file.recurse( directory + '/phet-io-site/demos', function callback( abspath, rootdir, subdir, filename ) {

    // TODO: this line is duplicated around chipper
    var contentsPath = subdir ? ( demosPath + '/' + subdir + '/' + filename ) : ( demosPath + '/' + filename );
    grunt.file.copy( abspath, contentsPath );
  } );

  grunt.file.recurse( directory + '/phet-io-site/devguide', function callback( abspath, rootdir, subdir, filename ) {

    // TODO: this line is duplicated around chipper
    var contentsPath = subdir ? ( devguidePath + '/' + subdir + '/' + filename ) : ( devguidePath + '/' + filename );
    grunt.file.copy( abspath, contentsPath );
  } );
};