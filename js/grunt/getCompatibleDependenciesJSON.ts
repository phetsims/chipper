// Copyright 2026, University of Colorado Boulder

/**
 * Creates an object that stores information about SHAs (dependencies.json) in a backward-compatible way.
 *
 * For internal use, please use the new buildInfo.json
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import { readFileSync } from 'fs';
import { Runnable } from '../../../perennial-alias/js/browser-and-node/PerennialTypes.js';
import { gitImmutableExecute } from '../../../perennial-alias/js/common/git/gitMutex.js';

export const getCompatibleDependenciesJSON = async (
  runnable: Runnable,
  includeBabel = false
): Promise<object> => {

  const packageObject = JSON.parse( readFileSync( `../${runnable}/package.json`, 'utf8' ) );
  const version = packageObject.version;

  const dependenciesInfo: Record<string, unknown> = {
    comment: `# ${runnable} ${version} ${new Date().toString()}`,
    totality: {
      sha: ( await gitImmutableExecute( [ 'rev-parse', 'HEAD' ], '..' ) ).trim(),
      branch: 'HEAD'
    }
  };

  if ( includeBabel ) {
    dependenciesInfo.babel = {
      sha: ( await gitImmutableExecute( [ 'rev-parse', 'HEAD' ], '../babel' ) ).trim(),
      branch: 'main'
    };
  }

  return dependenciesInfo;
};