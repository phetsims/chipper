// Copyright 2022, University of Colorado Boulder
const startTime = Date.now();

const execute = require( '../common/execute' );
const _ = require( 'lodash' ); // eslint-disable-line
const fs = require( 'fs' );

// constants
// Don't use getActiveRepos() since it cannot be run from the root
const contents = fs.readFileSync( 'perennial/data/active-repos', 'utf8' ).trim();
const repos = contents.split( '\n' ).map( sim => sim.trim() );

/**
 * Identify all repos with uncommitted changes, and run the precommit hooks on them.
 *
 * USAGE:
 * cd ${root containing all repos}
 * node perennial/js/scripts/precommit-hook-changed-repos.js
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
( async () => {

  // Detect uncommitted changes in each repo:
  // https://stackoverflow.com/questions/3878624/how-do-i-programmatically-determine-if-there-are-uncommitted-changes
  // git update-index --refresh
  // git diff-index --quiet HEAD --

  const updateIndexPromises = repos.map( repo => execute( 'git', 'update-index --refresh'.split( ' ' ), `${repo}`, {

    // resolve errors so Promise.all doesn't fail on first repo that cannot pull/rebase
    errors: 'resolve'
  } ) );
  await Promise.all( updateIndexPromises );

  const diffIndexPromises = repos.map( repo => execute( 'git', 'diff-index --quiet HEAD --'.split( ' ' ), `${repo}`, {

    // resolve errors so Promise.all doesn't fail on first repo that cannot pull/rebase
    errors: 'resolve'
  } ) );
  const results = await Promise.all( diffIndexPromises );

  // Find out which repos have uncommitted changes
  const changedRepos = [];
  for ( let i = 0; i < results.length; i++ ) {
    const repo = repos[ i ];
    const result = results[ i ];

    if ( result.code === 0 ) {

      // was up-to-date
    }
    else {

      // needs to push
      changedRepos.push( repo );
    }
  }
  console.log( 'detected changed repos: ' + changedRepos.join( ', ' ) );

  // This is done sequentially so we don't spawn a bunch of uncached tsc at once, but in the future we may want to optimize
  // to run one sequentially then the rest in parallel
  for ( let i = 0; i < changedRepos.length; i++ ) {

    process.stdout.write( changedRepos[ i ] + ': ' );

    const result = await execute( 'node', [ '../chipper/js/scripts/hook-pre-commit.js' ], `${changedRepos[ i ]}`, {

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

  const endTime = Date.now();
  console.log( 'Done in ' + ( endTime - startTime ) + 'ms' );
} )();