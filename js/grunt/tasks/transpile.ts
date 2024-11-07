// Copyright 2013-2024, University of Colorado Boulder

import getOption from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import transpile, { getTranspileOptions } from '../transpile.js';

/**
 * Transpile TypeScript to JavaScript.
 *
 * Options
 * --watch: Continue watching all directories and transpile on detected changes.
 * --clean: Delete of the output directory before transpiling.
 * --silent: Disable any logging output.
 * --all: Transpile all repos. (default)
 * --repo=my-repo: Transpile a specific repo.
 * --repos-my-repo-1,my-repo-2: Transpile a list of repos.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

transpile( getTranspileOptions( {
  all: getOption( 'all', true )
} ) );