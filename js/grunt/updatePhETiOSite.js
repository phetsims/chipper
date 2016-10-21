// Copyright 2015, University of Colorado Boulder

/**
 * Copy materials to phet-io-site, see phet-io-site-readme.md
 *
 * @author Sam Reid
 */

// modules
var assert = require( 'assert' );
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

// constants
var directory = process.cwd();

/**
 * @param grunt the grunt instance
 * @param buildConfig
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  var packageVersion = buildConfig.version;

  assert( grunt.option( 'siteversion' ), '--siteversion must be specified' );

  var filter = function( text ) {

    text = ChipperStringUtils.replaceAll( text,
      '../assets/',
      '../../assets/' + packageVersion + '/'
    );

    text = ChipperStringUtils.replaceAll( text,
      '../../../js/',
      '../../../lib/' + packageVersion + '/'
    );
    return text;
  };

  var siteVersion = grunt.option( 'siteversion' ) + ''; // convert number to string

  if ( siteVersion.indexOf( '.' ) < 0 ) {
    siteVersion = siteVersion + '.0'; // Drop missing ".0" suffix if missing
  }

  var assetsPath = directory + '/../phet-io-site/' + siteVersion + '/assets/' + packageVersion;
  var demosPath = directory + '/../phet-io-site/' + siteVersion + '/demos/' + packageVersion;
  var devguidePath = directory + '/../phet-io-site/' + siteVersion + '/devguide/' + packageVersion;

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
    var contents = grunt.file.read( abspath );
    contents = filter( contents );

    // Write the file
    grunt.file.write( contentsPath, contents );
    grunt.log.writeln( 'wrote ' + contentsPath );
  } );

  grunt.file.recurse( directory + '/phet-io-site/devguide', function callback( abspath, rootdir, subdir, filename ) {

    // TODO: this line is duplicated around chipper
    var contentsPath = subdir ? ( devguidePath + '/' + subdir + '/' + filename ) : ( devguidePath + '/' + filename );

    var contents = grunt.file.read( abspath );
    contents = filter( contents );

    // Write the file
    grunt.file.write( contentsPath, contents );
    grunt.log.writeln( 'wrote ' + contentsPath );
  } );

  // TODO: chipper#101 eek, this is scary! we are importing from the repository dir. ideally we should just have uglify-js installed once in chipper?
  var uglify = require( '../../../' + buildConfig.name + '/node_modules/uglify-js' );

  var destinationPath = '../phet-io-site/' + siteVersion + '/lib';

  var minifyAndWrite = function( filename ) {
    var minified = uglify.minify( [ '../phet-io/js/' + filename ], {
      mangle: true,
      output: {
        inline_script: true, // escape </script
        beautify: false
      },
      compress: {
        global_defs: {}
      }
    } ).code;

    var copyrightHeader = '// Copyright 2002-2016, University of Colorado Boulder\n' +
                          '// This PhET-iO file requires a license\n' +
                          '// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' +
                          '// For licensing, please contact phethelp@colorado.edu';
    grunt.file.write( destinationPath + '/' + packageVersion + '/' + filename, copyrightHeader + '\n\n' + minified );
  };

  minifyAndWrite( 'SimIFrameClient.js' );

  // Determine which sim versions will be pointed to by WrapperUtils
  minifyAndWrite( 'WrapperUtils.js' );
};