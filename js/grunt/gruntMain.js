// Copyright 2024, University of Colorado Boulder

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

  const commonJSTranspiler = new Transpiler();

  /**
   Transpile the entry points
   These files may have already been transpiled by a watch process. In that case, these lines are a no-op.
   For build servers and other processes that do not have a watch process, or if a developer watch process is not running
   or out-of-date, this will transpile synchronously during startup.

   If we forgot to transpile something, we will get a module not found runtime error, and
   can add more entry points to this list.

   Note that 2 Transpile processes trying to write the same file at the same time may corrupt the file, since
   we do not have atomic writes.
   */
  // TODO: should this be silent?  https://github.com/phetsims/chipper/issues/1437
  commonJSTranspiler.transpileRepoWithModes( 'chipper', [ 'commonjs' ] );
  commonJSTranspiler.transpileRepoWithModes( 'phet-core', [ 'commonjs' ] );
  commonJSTranspiler.transpileRepoWithModes( 'perennial-alias', [ 'commonjs' ] );
  commonJSTranspiler.saveCache();

  // TODO: Make sure the above repos are covered by tsconfig/all, see https://github.com/phetsims/chipper/issues/1437

  // use chipper's gruntfile
  module.exports = require( '../../dist/commonjs/chipper/js/grunt/Gruntfile.js' );
}
else {
  module.exports = require( './Gruntfile.js' );
}