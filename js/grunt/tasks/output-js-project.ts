// Copyright 2013-2024, University of Colorado Boulder

/**
 * Outputs JS for the specified repo and its dependencies
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const Transpiler = require( '../../common/Transpiler' );
const getPhetLibs = require( '../getPhetLibs' );
import getRepo from './util/getRepo';

const transpiler = new Transpiler( { silent: true } );
transpiler.transpileRepos( getPhetLibs( getRepo() ) );