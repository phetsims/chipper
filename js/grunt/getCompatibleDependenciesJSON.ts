// Copyright 2026, University of Colorado Boulder

/**
 * Creates an object that stores information about SHAs (dependencies.json) in a backward-compatible way.
 *
 * For internal use, please use the new buildInfo.json
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import { readFileSync } from 'fs';
import execute from '../../../perennial-alias/js/common/execute.js';
import { Repo } from '../../../perennial-alias/js/browser-and-node/PerennialTypes.js';

export const getCompatibleDependenciesJSON = async (
  repo: Repo,
  includeBabel = false
): Promise<object> => {

  const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );
  const version = packageObject.version;

  const dependenciesInfo: Record<string, unknown> = {
    comment: `# ${repo} ${version} ${new Date().toString()}`,
    totality: {
      sha: ( await execute( 'git', [ 'rev-parse', 'HEAD' ], '..' ) ).trim(),
      branch: 'HEAD'
    }
  };

  if ( includeBabel ) {
    dependenciesInfo.babel = {
      sha: ( await execute( 'git', [ 'rev-parse', 'HEAD' ], '../babel' ) ).trim(),
      branch: 'main'
    };
  }

  return dependenciesInfo;
};