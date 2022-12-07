// Copyright 2022, University of Colorado Boulder
const startTime = Date.now();

const execute = require( '../../../perennial-alias/js/common/execute' );
const fs = require( 'fs' );
const child_process = require( 'child_process' );

// constants
// Don't use getActiveRepos() since it cannot be run from the root
const contents = fs.readFileSync( 'perennial-alias/data/active-repos', 'utf8' ).trim();
const repos = contents.split( '\n' ).map( sim => sim.trim() );

const args = process.argv.slice( 2 );
const all = args.includes( '--all' );

/**
 * Identify all repos with uncommitted changes, and run the precommit hooks on them.
 *
 * USAGE:
 * cd ${root containing all repos}
 * node chipper/js/scripts/precommit-hook-multi.js
 *
 * OPTIONS:
 *
 * --all
 * Runs the precommit hooks on all repos.  Default behavior is to only check the repos with uncommitted changes.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

( async () => {

  let reposToTest = repos;

  if ( !all ) {

    const execOnRepos = async ( repoSubset, command ) => {

      const promises = repoSubset.map( repo => {
        return new Promise( resolve => child_process.exec( command, { cwd: repo }, error => resolve( error ) ) );
      } );
      const results = await Promise.all( promises );

      // Find out which repos have uncommitted changes
      const changedRepos = [];
      for ( let i = 0; i < results.length; i++ ) {
        if ( results[ i ] !== null ) {
          changedRepos.push( repoSubset[ i ] );
        }
      }

      return changedRepos;
    };

    // Detect uncommitted changes in each repo:
    // https://stackoverflow.com/questions/3878624/how-do-i-programmatically-determine-if-there-are-uncommitted-changes
    // git diff-index --quiet HEAD --
    // This will error if the diff-index shows any changes in the repo, otherwise error is null.
    const changedRepos = await execOnRepos( repos, 'git update-index --refresh && git diff-index --quiet HEAD --' );

    console.log( 'detected changed repos: ' + changedRepos.join( ', ' ) );

    reposToTest = changedRepos;
  }

  // This is done sequentially so we don't spawn a bunch of uncached tsc at once, but in the future we may want to optimize
  // to run one sequentially then the rest in parallel
  for ( let i = 0; i < reposToTest.length; i++ ) {

    process.stdout.write( reposToTest[ i ] + ': ' );

    const result = await execute( 'node', [ '../chipper/js/scripts/hook-pre-commit.js' ], `${reposToTest[ i ]}`, {

      // resolve errors so Promise.all doesn't fail on first repo that cannot pull/rebase
      errors: 'resolve'
    } );
    if ( result.code === 0 ) {

      console.log( 'Success' );
    }
    else {
      console.log();
      result.stdout.trim().length > 0 && console.log( result.stdout.trim() );
      result.stderr.trim().length > 0 && console.log( result.stderr.trim() );
    }
  }

  console.log( 'Done in ' + ( Date.now() - startTime ) + 'ms' );
} )();