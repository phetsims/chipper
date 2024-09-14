// Copyright 2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const Transpiler = require( '../../common/Transpiler' );
const getOption = require( './util/getOption' );
const transpiler = new Transpiler( { silent: true } );

const repos = getOption( 'repos' );

transpiler.transpileRepo( repos.split( ',' ) );