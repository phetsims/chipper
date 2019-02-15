// Copyright 2017, University of Colorado Boulder

/**
 * Runs the require.js optimizer step on a given config file.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// modules
const chipperGlobals = require( './chipperGlobals' );
const grunt = require( 'grunt' );
const istanbul = require( 'istanbul' );
const requirejs = require( 'requirejs' );

/**
 * Runs a require.js optimizer build step.
 * @public
 *
 * @param {string} repo
 * @param {string} mainConfigFile - path to the config file
 * @param {Object} [options]
 * @returns {Promise.<string>} - The combined JS output from the optimizer
 */
module.exports = function( repo, mainConfigFile, options ) {

  const {
    wrap = true,
    insertRequire = false,
    instrument = false,
    brand = 'phet'
  } = options || {};

  /**
   * Runs the require.js optimizer to determine and combine all of the dependent .js files.
   * @public
   *
   * @returns {Promise} - Resolves with js: {string}
   */
  return new Promise( ( resolve, reject ) => {
    let output;

    const instrumenter = instrument ? new istanbul.Instrumenter() : null;

    const config = {

      // Includes a require.js stub called almond, so that we don't have to include the full require.js runtime
      // inside of builds. This helps reduce file size, and the rest of require.js isn't needed. See
      // https://github.com/phetsims/chipper/issues/277
      // See https://github.com/requirejs/almond for more about specifying name=almond
      name: 'almond',

      optimize: 'none',

      wrap: wrap,

      // Avoid optimization names that are outside the baseUrl, see http://requirejs.org/docs/optimization.html#pitfalls
      paths: {
        almond: '../../sherpa/lib/almond-0.2.9'
      },

      // JS config file
      mainConfigFile: mainConfigFile,

      // Add instrumentation if required
      onBuildWrite: function( moduleName, path, contents ) {
        if ( instrumenter &&
             path.indexOf( '.js' ) > 0 &&
             path.indexOf( '..' ) < 0 &&
             moduleName.indexOf( '!' ) < 0 ) {
          const filePath = `../${repo}/build/instrumentation/${moduleName}.js`;
          const fileDir = filePath.slice( 0, filePath.lastIndexOf( '/' ) );
          grunt.file.mkdir( fileDir );
          grunt.file.write( filePath, contents );
          grunt.log.debug( 'instrumenting ' + filePath );
          return instrumenter.instrumentSync( contents, filePath );
        }
        else {
          return contents;
        }
      },

      // optimized output file
      out( js, sourceMap ) {
        output = js;
      },

      // turn off preservation of comments that have a license in them
      preserveLicenseComments: false,

      // modules to stub out in the optimized file
      stubModules: [ 'string', 'sound', 'image', 'mipmap' ]
    };

    if ( insertRequire ) {
      config.insertRequire = [ insertRequire ];
    }

    // Initialize global state in preparation for the require.js step.
    chipperGlobals.beforeBuild( brand );

    requirejs.optimize( config, function( buildResponse ) {
      grunt.log.ok( `require.js optimization for brand: ${brand} complete (${output.length} bytes)` );
      resolve( output );
    }, function( err ) {
      reject( new Error( err ) );
    } );
  } );
};
