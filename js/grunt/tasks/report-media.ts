// Copyright 2024, University of Colorado Boulder

import getRepo from './util/getRepo';

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

const reportMedia = require( '../reportMedia' );

( async () => {
  await reportMedia( repo );
} )();