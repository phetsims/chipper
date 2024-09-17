// Copyright 2024, University of Colorado Boulder

/**
 * Outputs JS for all repos
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const Transpiler = require( '../../common/Transpiler' );
const transpiler = new Transpiler( { silent: true } );

transpiler.transpileAll();