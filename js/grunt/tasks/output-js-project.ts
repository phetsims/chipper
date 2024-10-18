// Copyright 2013-2024, University of Colorado Boulder

import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import getPhetLibs from '../getPhetLibs';
import transpile from '../transpile.js';

/**
 * Outputs JS for the specified repo and its dependencies
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
transpile( getPhetLibs( getRepo() ) );