// Copyright 2024, University of Colorado Boulder

import assert from 'assert';
import _ from 'lodash';
import { Repo } from '../../../perennial-alias/js/common/PerennialTypes.js';
import getOption from '../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo, { getRepos } from '../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import transpileSWC from '../common/transpileSWC.js';
import getActiveRepos from '../../../perennial-alias/js/common/getActiveRepos';

type TranspileOptions = {

  // Transpile all repos
  all: boolean;

  // Delete of the output directory before transpiling
  clean: boolean;

  // Continue watching all directories and transpile on detected changes.
  watch: boolean;

  // Additional repos to compile (not listed in perennial-alias/data/active-repos). The names of the repos,
  // separated by commas, like --repos=myrepo1,myrepo2. Directory names only, not paths
  // TODO: This should just be the list of repos, not the list of additional repos, see https://github.com/phetsims/chipper/issues/1354
  repos: Repo[];

  silent: boolean; // any logging output.

  brands: string[]; // Extra brands in the brand repo to transpile.
};

/**
 * Function to support transpiling on the project. See grunt transpile
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
const transpile = async ( providedOptions: Partial<TranspileOptions> ): Promise<void> => {
  const start = Date.now();

  const options = _.assignIn( {
    all: false,
    silent: false,
    clean: false,

    // TODO: I don't think this is working still But I can't reproduce easily: https://github.com/phetsims/chipper/issues/1499
    /*
    {
  all: true,
  silent: false,
  clean: false,
  watch: true,
  repos: [ 'density' ],
  brands: []
}
Clean stale chipper/dist/js files finished in 1444ms
Finished initial transpilation in 4107ms
Watching...
Restarting 'C:\\Program Files\\nodejs\\node_modules\\grunt\\bin\\grunt output-js --no-respawning'
Running "output-js" task
{
  all: true,
  silent: false,
  clean: false,
  watch: true,
  repos: [ 'density' ],
  brands: []
}
Clean stale chipper/dist/js files finished in 1398ms
Finished initial transpilation in 4072ms
Watching...
     */
    watch: false,
    repos: []
  }, providedOptions );

  assert( options.repos.length > 0 || options.all, 'must include repos or --all' );
  const repos = options.all ? getActiveRepos() : options.repos;

  await transpileSWC( _.uniq( repos ), !!options.watch, options.brands || [], options.clean );

  !options.silent && console.log( 'Finished initial transpilation in ' + ( Date.now() - start ) + 'ms' );
  !options.silent && options.watch && console.log( 'Watching...' );
};

// Parse command line options into an object for the module
export const getTranspileOptions = ( options?: Partial<TranspileOptions> ): TranspileOptions => {

  const repo = getRepo();
  const repos = getRepos();

  return _.assignIn( {
    repos: repos.length > 0 ? repos : [ repo ],
    brands: getOption( 'brands' ) ? getOption( 'brands' ).split( ',' ) : [],
    all: !!getOption( 'all' ),
    clean: !!getOption( 'clean' ),
    silent: !!getOption( 'silent' ),
    watch: !!getOption( 'watch' )
  }, options );
};

export default transpile;