// Copyright 2022, University of Colorado Boulder

/**
 * Runs the lint rules on the specified repos. This file will run an individual lint process per repo provided. This
 * improves the caching implementation so that it can be shared with other lint processes that lint the same repos, but
 * a different complete list.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

// modules
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const { ESLint } = require( 'eslint' ); // eslint-disable-line
const grunt = require( 'grunt' );
const lint = require( './lint' );

module.exports = async ( repos, options ) => {

  options = _.extend( {
    cache: true,
    fix: false,
    format: false,
    chipAway: false
  }, options );

  const allResults = [];
  for ( let i = 0; i < repos.length; i++ ) {
    const results = await lint( [ `../${repos[ i ]}` ], {
      cache: options.cache,
      fix: options.fix,
      format: options.format,
      chipAway: options.chipAway,
      warn: false
    } );
    allResults.push( results );
  }

  let totalProblems = 0;
  for ( let i = 0; i < allResults.length; i++ ) {
    const results = allResults[ i ];
    const totalWarnings = _.sum( results.map( result => result.warningCount ) );
    const totalErrors = _.sum( results.map( result => result.errorCount ) );

    totalProblems += totalWarnings + totalErrors;
  }
  if ( totalProblems > 0 ) {
    grunt.warn( 'Lint problems: ' + totalProblems + '.' );
  }
};