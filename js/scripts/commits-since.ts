// Copyright 2013-2024, University of Colorado Boulder

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

import assert from 'assert';
import execute from '../../../perennial-alias/js/common/execute.js';
import getOption from '../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo from '../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import getPhetLibs from '../grunt/getPhetLibs.js';

( async () => {

  const repo = getRepo();
  const dateString = getOption( 'date' );
  assert( dateString, 'missing required option: --date={{DATE}}' );

  let output = '';
  for ( const dependency of getPhetLibs( repo ) ) {
    output += `${dependency} since ${dateString} ----------------------------------------------\n`;

    const logOut = await execute( 'git', [ 'log', `--since="${dateString}"`, '--pretty=tformat:"%h | %ci | %cn | %s"' ], `../${dependency}` );
    output += logOut;
  }

  console.log( output );
} )();