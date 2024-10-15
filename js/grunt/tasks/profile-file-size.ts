// Copyright 2013-2024, University of Colorado Boulder

import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo';
import profileFileSize from '../profileFileSize';

/**
 * Profiles the file size of the built JS file for a given repo
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
  // TODO: https://github.com/phetsims/chipper/issues/1461 probably does not need to be here in grunt. Does anyone use it? Search for docs in the code review checklist
  // Dev team consensus: move to node. Run like this: `node ../chipper/js/scripts/profile-file-size.js`
  // TODO: Add to code review checklist, see https://github.com/phetsims/chipper/issues/1461
const repo = getRepo();

( async () => {
  await profileFileSize( repo );
} )();