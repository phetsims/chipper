// Copyright 2013-2024, University of Colorado Boulder

import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo';

/**
 * (project-wide) Report on license.json files throughout all working copies.
 * Reports any media (such as images or sound) files that have any of the following problems:
 * (1) incompatible-license (resource license not approved)
 * (2) not-annotated (license.json missing or entry missing from license.json)
 * (3) missing-file (entry in the license.json but not on the file system)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

// eslint-disable-next-line phet/require-statement-match
const _reportMedia = require( '../reportMedia' );

export const reportMedia = ( async () => {
  await _reportMedia( repo );
} )();