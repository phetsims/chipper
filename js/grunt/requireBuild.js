// Copyright 2017, University of Colorado Boulder

/**
 * Runs the require.js optimizer step on a given config file.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

// modules
const requirejs = require( 'requirejs' );

module.exports = function( grunt, mainConfigFile, options ) {

  const {
    wrap = true,
    insertRequire = false
  } = options || {};

  /**
   * Runs the require.js optimizer to determine and combine all of the dependent .js files.
   * @public
   *
   * @returns {Promise} - Resolves with js: {string}
   */
  return new Promise( ( resolve, reject ) => {
    var output;

    const config = {

      // Includes a require.js stub called almond, so that we don't have to include the full require.js runtime
      // inside of builds. This helps reduce file size, and the rest of require.js isn't needed. See
      // https://github.com/phetsims/chipper/issues/277
      // See https://github.com/requirejs/almond for more about specifying name=almond
      name: 'almond',

      optimize: 'none',

      wrap,

      // Avoid optimization names that are outside the baseUrl, see http://requirejs.org/docs/optimization.html#pitfalls
      paths: {
        almond: '../../sherpa/lib/almond-0.2.9'
      },

      // JS config file
      mainConfigFile,

      // optimized output file
      out( js, sourceMap ) {
        output = js;
      },

      // turn off preservation of comments that have a license in them
      preserveLicenseComments: false,

      // modules to stub out in the optimized file
      stubModules: [ 'string', 'audio', 'image', 'mipmap' ]
    };

    if ( insertRequire ) {
      config.insertRequire = [ insertRequire ];
    }

    requirejs.optimize( config, function( buildResponse ) {
      resolve( output );
    }, function( err ) {
      reject( err );
    } );
  } );
};
