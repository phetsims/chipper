// Copyright 2013-2024, University of Colorado Boulder

import getRepo from './util/getRepo';

/**
 * Outputs JS just for the specified repo
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const Transpiler = require( '../../common/Transpiler' );
const transpiler = new Transpiler( { silent: true } );

const repo = getRepo();

transpiler.transpileRepo( repo );