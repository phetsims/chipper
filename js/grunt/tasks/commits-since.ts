// Copyright 2013-2024, University of Colorado Boulder

/**
 * Shows commits since a specified date. Use --date=<date> to specify the date.
 * TODO: move to chipper/js/scripts/ https://github.com/phetsims/perennial/issues/370
 * TODO: inline the module into this script https://github.com/phetsims/perennial/issues/370
 * @author Sam Reid (PhET Interactive Simulations)
 */

import assert from 'assert';
import getOption from '../../../../perennial-alias/js/grunt/tasks/util/getOption';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo';

const commitsSince = require( '../commitsSince.js' );

const repo = getRepo();
const dateString = getOption( 'date' );
assert( dateString, 'missing required option: --date={{DATE}}' );

( async () => {
  await commitsSince( repo, dateString );
} )();