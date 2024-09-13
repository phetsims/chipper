// Copyright 2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

const getRepo = require( './getRepo' );
const grunt = require( 'grunt' );
const webpackDevServer = require( '../webpackDevServer' );

const repo = getRepo();

const repos = grunt.option( 'repos' ) ? grunt.option( 'repos' ).split( ',' ) : [ repo ];
const port = grunt.option( 'port' ) || 9000;
let devtool = grunt.option( 'devtool' ) || 'inline-source-map';
if ( devtool === 'none' || devtool === 'undefined' ) {
  devtool = undefined;
}
const openChrome = grunt.option( 'chrome' ) || false;

// NOTE: We don't care about the promise that is returned here, because we are going to keep this task running
// until the user manually kills it.
webpackDevServer( repos, port, devtool, openChrome );