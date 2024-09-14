// Copyright 2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

const getRepo = require( './util/getRepo' );
const webpackDevServer = require( '../webpackDevServer' );
const getOption = require( './util/getOption' );

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