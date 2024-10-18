// Copyright 2013-2024, University of Colorado Boulder

import getOption from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo, { getRepos } from '../../../../perennial-alias/js/grunt/tasks/util/getRepo';
import transpile from '../transpile.js';

/**
 * Outputs JS just for the specified repo
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */


const repo = getRepo();
const repos = getRepos();
const all = !!getOption( 'all' );

// Prefer the "all" option, then otherwise the "repos" option, and otherwise the single repo
transpile( all ? 'all' :
           repos.length > 0 ? repos :
             [ repo ]
);