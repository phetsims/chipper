// Copyright 2013-2024, University of Colorado Boulder

/**
 * Shows commits since a specified date. Use --date=<date> to specify the date.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// TODO: https://github.com/phetsims/chipper/issues/1461 probably does not need to be here in grunt
// SR, AV, JB, MK, JG do not use it. We will check with @pixelzoom to see if it is OK to move to node.
// MK: But it is nice having a central registry + pattern for "things we run in sim/common repos"

import getRepo from './util/getRepo';

const commitsSince = require( '../commitsSince' );

import assert from 'assert';
import getOption from './util/getOption';

const repo = getRepo();
const dateString = getOption( 'date' );
assert( dateString, 'missing required option: --date={{DATE}}' );

( async () => {
  await commitsSince( repo, dateString );
} )();