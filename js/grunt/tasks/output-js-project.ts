// Copyright 2013-2024, University of Colorado Boulder

import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import Transpiler from '../../common/Transpiler';
import getPhetLibs from '../getPhetLibs';

/**
 * Outputs JS for the specified repo and its dependencies
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

const transpiler = new Transpiler( { silent: true } );
const repo = getRepo();

transpiler.transpileRepos( getPhetLibs( repo ) );