// Copyright 2013-2024, University of Colorado Boulder

import _ from 'lodash';
import getOption, { isOptionKeyProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import transpile, { getTranspileCLIOptions } from '../../common/transpile.js';

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

const defaultOptions = {
  all: isOptionKeyProvided( 'all' ) ? getOption( 'all' ) : true
};

// TODO: use combineOptions, see https://github.com/phetsims/chipper/issues/1523
transpile( _.assignIn( defaultOptions, getTranspileCLIOptions() ) );