// Copyright 2022-2024, University of Colorado Boulder

/**
 * gruntMain.js is the entry point for launching the grunt tasks for the PhET build system.
 *
 * In order to support development with TypeScript for the grunt tasks, transpile before starting and then point
 * to the transpiled version.
 *
 * Since this is the entry point for TypeScript, it and its dependencies must remain in JavaScript.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

/* eslint-env node */

// Switch between TypeScript and JavaScript
const LAUNCH_FROM_CHIPPER_DIST = false;

if ( LAUNCH_FROM_CHIPPER_DIST ) {

  const Transpiler = require( '../../js/common/Transpiler' );

  const commonJSTranspiler = new Transpiler( { verbose: true, mode: 'commonjs' } );

  // Transpile the entry points
  // If we forgot to transpile something, we will get a module not found runtime error, and
  // can add more entry points to this list.
  // TODO: Visit these during a watch process, so this can remain just a "safety net" https://github.com/phetsims/chipper/issues/1272
  commonJSTranspiler.transpileRepo( 'chipper' );
  commonJSTranspiler.transpileRepo( 'phet-core' );
  commonJSTranspiler.transpileRepo( 'perennial-alias' );
  commonJSTranspiler.saveCache();

  // TODO: When should we run a type check? https://github.com/phetsims/chipper/issues/1272

  // use chipper's gruntfile
  module.exports = require( '../../dist/commonjs/chipper/js/grunt/Gruntfile.js' );
}
else {
  module.exports = require( './Gruntfile.js' );
}