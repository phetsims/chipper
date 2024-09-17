// Copyright 2024, University of Colorado Boulder

const getRepo = require( './util/getRepo' );

/**
 * Shows commits since a specified date. Use --date=<date> to specify the date.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

  // TODO: https://github.com/phetsims/chipper/issues/1461 probably does not need to be here in grunt
  // SR, AV, JB, MK, JG do not use it. We will check with @pixelzoom to see if it is OK to move to node.
  // MK: But it is nice having a central registry + pattern for "things we run in sim/common repos"


const repo = getRepo();
const getOption = require( './util/getOption' );

const dateString = getOption( 'date' );
assert( dateString, 'missing required option: --date={{DATE}}' );

const commitsSince = require( '../commitsSince' );
const assert = require( 'assert' );

await commitsSince( repo, dateString );