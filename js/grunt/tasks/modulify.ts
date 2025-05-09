// Copyright 2013-2025, University of Colorado Boulder

/**
 * Creates *.js modules for all images/strings/audio/etc in a repo
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import { getOption } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';

// eslint-disable-next-line phet/default-import-match-filename
import _modulify from '../modulify/modulify.js';

export const modulifyPromise = ( async () => {

  const repo = getRepo();

  const targets = getOption( 'targets' );

  await _modulify( repo, targets ? targets.split( ',' ) : null );
} )();