// Copyright 2013-2025, University of Colorado Boulder

import getOption, { isOptionKeyProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import { combineOptions } from '../../../../phet-core/js/optionize.js';
import transpile, { getTranspileCLIOptions, TranspileOptions } from '../../common/transpile.js';

/**
 * Transpile TypeScript to JavaScript.
 *
 * Options
 * --live: Continue watching all directories and transpile on detected changes.
 * --clean: Delete of the output directory before transpiling.
 * --silent: Disable any logging output.
 * --all: Transpile all repos. (default)
 * --repo=my-repo: Transpile a specific repo.
 * --repos-my-repo-1,my-repo-2: Transpile a list of repos.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

transpile( combineOptions<TranspileOptions>( {
  all: isOptionKeyProvided( 'all' ) ? getOption( 'all' ) : true
}, getTranspileCLIOptions() ) );