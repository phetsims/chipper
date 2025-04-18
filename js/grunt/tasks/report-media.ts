// Copyright 2013-2025, University of Colorado Boulder

/**
 * (project-wide) Report on license.json files throughout all working copies.
 * Reports any media (such as images or sound) files that have any of the following problems:
 * (1) incompatible-license (resource license not approved)
 * (2) not-annotated (license.json missing or entry missing from license.json)
 * (3) missing-file (entry in the license.json but not on the file system)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import _reportMedia from '../reportMedia.js'; // eslint-disable-line phet/default-import-match-filename

const repo = getRepo();

export const reportMediaPromise = ( async () => {
  await _reportMedia( repo );
} )();