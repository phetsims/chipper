// Copyright 2013-2024, University of Colorado Boulder

/**
 * Runs a webpack server for a given list of simulations.
 * --repos=REPOS for a comma-separated list of repos (defaults to current repo)
 * --port=9000 to adjust the running port
 * --devtool=string value for sourcemap generation specified at https://webpack.js.org/configuration/devtool or undefined for (none)
 * --chrome: open the sims in Chrome tabs (Mac)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// TODO: https://github.com/phetsims/chipper/issues/1461 probably does not need to be here in grunt, or maybe just delete?
  // Dev meeting consensus: DELETE

import getRepo from './util/getRepo';
const webpackDevServer = require( '../webpackDevServer' );
import getOption from './util/getOption';

const repo = getRepo();

const repos = getOption( 'repos' ) ? getOption( 'repos' ).split( ',' ) : [ repo ];
const port = getOption( 'port' ) || 9000;
let devtool = getOption( 'devtool' ) || 'inline-source-map';
if ( devtool === 'none' || devtool === 'undefined' ) {
  devtool = undefined;
}
const openChrome = getOption( 'chrome' ) || false;

// NOTE: We don't care about the promise that is returned here, because we are going to keep this task running
// until the user manually kills it.
webpackDevServer( repos, port, devtool, openChrome );