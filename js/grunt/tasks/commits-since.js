// Copyright 2024, University of Colorado Boulder

const getRepo = require( './getRepo' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const grunt = require( 'grunt' );
const repo = getRepo();
const parseGruntOptions = require( './parseGruntOptions' );

// Initialize Grunt options with parsed arguments
grunt.option.init( parseGruntOptions() );

const dateString = grunt.option( 'date' );
assert( dateString, 'missing required option: --date={{DATE}}' );

const commitsSince = require( '../commitsSince' );
const assert = require( 'assert' );

await commitsSince( repo, dateString );