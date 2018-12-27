// Copyright 2015, University of Colorado Boulder

/**
 * Prints commits since a specified date, for all dependencies of the build target.
 * The output is grouped by repository, and condensed to one line per commit.
 * The date is in ISO 8601 format
 *
 * For example, to see all commits since Oct 1, 2015 at 3:52pm:
 * grunt commits-since --date="2015-10-01 15:52"
 *
 * To count the number of commits, use the power of the shell:
 * grunt commits-since --date="2015-10-01 15:52" | grep -v since | wc -l
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

'use strict';

const execute = require( './execute' );
const getPhetLibs = require( './getPhetLibs' );
const grunt = require( 'grunt' );

/**
 * @param {string} repo
 * @param {string} dateString
 * @returns {Promise}
 */
module.exports = async function( repo, dateString ) {

  let output = '';
  for ( const dependency of getPhetLibs( repo ) ) {
    output += `${dependency} since ${dateString} ----------------------------------------------\n`;
    output += await execute( 'git', [ 'log', `--since="${dateString}"`, '--pretty=tformat:"%h | %ci | %cn | %s"' ], { cwd: `../${dependency}` } );
  }

  grunt.log.writeln( output );
};
