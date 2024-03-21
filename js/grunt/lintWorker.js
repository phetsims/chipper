// Copyright 2024, University of Colorado Boulder

/**
 * A lightweight layer for launching lint via a Worker process, see lint.js.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

const lint = require( './lint' );
const { parentPort } = require( 'worker_threads' ); // eslint-disable-line require-statement-match

const listener = async messageData => {
  const result = await lint.lintReposFromWorker( messageData.repos, messageData.options );
  parentPort.postMessage( result );

  // We have completed our task. Very important to exit fully here to prevent memory leaks caused by our linting library.
  // See https://github.com/phetsims/chipper/issues/1415
  // This is preferable to process.exit(), which can prevent queued console.log messages from being printed
  parentPort.off( 'message', listener );
};
parentPort.on( 'message', listener );
