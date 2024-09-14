// Copyright 2024, University of Colorado Boulder

const getRepo = require( './util/getRepo' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();
const getOption = require( './util/getOption' );

const dateString = getOption( 'date' );
assert( dateString, 'missing required option: --date={{DATE}}' );

const commitsSince = require( '../commitsSince' );
const assert = require( 'assert' );

await commitsSince( repo, dateString );