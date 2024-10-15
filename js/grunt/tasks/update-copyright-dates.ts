// Copyright 2013-2024, University of Colorado Boulder

import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo';
import updateCopyrightDates from '../updateCopyrightDates';

/**
 * Update the copyright dates in JS source files based on Github dates
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// Grunt task that determines created and last modified dates from git, and
  // updates copyright statements accordingly, see #403
const repo = getRepo();

( async () => {
  await updateCopyrightDates( repo );
} )();