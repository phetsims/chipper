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
const showCommandLineProgress = require( '../common/showCommandLineProgress' );
const lint = require( './lint' );

module.exports = async ( repos, options ) => {

  options = _.extend( {
    cache: true,
    fix: false,
    format: false,
    chipAway: false,
    showProgressBar: true,
    warn: false
  }, options );

  const allResults = [];
  for ( let i = 0; i < repos.length; i++ ) {

    options.showProgressBar && showCommandLineProgress( i / repos.length, false );

    const results = await lint( [ `../${repos[ i ]}` ], {
      cache: options.cache,
      fix: options.fix,
      format: options.format,
      chipAway: false, // silence individual repo reporting
      silent: true, // silence individual repo reporting
      warn: false // silence individual repo reporting
    } );

    // MK found that results are unique to a file, so this seemed safe and was working well.
    allResults.push( ...results );
  }

  options.showProgressBar && showCommandLineProgress( 1, true );

  await lint.processResults( allResults, {
    chipAway: options.chipAway,
    warn: options.warn,
    silent: false // we want to hear the results
  } );
};