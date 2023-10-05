// Copyright 2023, University of Colorado Boulder

/**
 * webpackGlobalLibraries define the third party library files that load with a global. These must be here to support
 * building sims through webpack.
 * When adding to this file, note that it is most likely tested against the resource located in chipper/dist, so
 * full paths are less than ideal.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

const assert = require( 'assert' );
const webpackGlobalLibraries = {
  peggy: 'sherpa/lib/peggy-3.0.2.js',
  himalaya: 'sherpa/lib/himalaya-1.1.0.js'
};

Object.keys( webpackGlobalLibraries ).forEach( key => {
  const filePath = webpackGlobalLibraries[ key ];

  // If you need to support from another repo, just add to this assertion
  assert( filePath.startsWith( 'sherpa' ), 'Path must start with the repo to support transpiling, see Transpiler' );
} );

module.exports = webpackGlobalLibraries;
