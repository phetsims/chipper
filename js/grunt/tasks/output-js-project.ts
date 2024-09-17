// Copyright 2024, University of Colorado Boulder

/**
 * Outputs JS for the specified repo and its dependencies
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const Transpiler = require( '../../common/Transpiler' );
import getOption from './util/getOption';

const transpiler = new Transpiler( { silent: true } );

const repos = getOption( 'repos' );

transpiler.transpileRepo( repos.split( ',' ) );