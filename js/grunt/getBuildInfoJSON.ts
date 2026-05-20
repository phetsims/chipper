// Copyright 2026, University of Colorado Boulder

/**
 * Creates an object that stores information about a specific build (buildInfo.json).
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import fsPromises from 'fs/promises';
import { BuildInfoJSON } from '../../../perennial-alias/js/browser-and-node/PerennialTypes.js';
import getPhetLibs from './getPhetLibs.js';
import { gitImmutableExecute } from '../../../perennial-alias/js/common/git/gitMutex.js';

export const getBuildInfoJSON = async (
  repo: string
): Promise<BuildInfoJSON> => {
  return {
    name: repo,
    version: JSON.parse( await fsPromises.readFile( `../${repo}/package.json`, 'utf8' ) ).version,
    date: new Date().toString(),
    totalitySHA: ( await gitImmutableExecute( [ 'rev-parse', 'HEAD' ], '..' ) ).trim(),
    babelSHA: ( await gitImmutableExecute( [ 'rev-parse', 'HEAD' ], '../babel' ) ).trim(),
    dependencyDirectories: getPhetLibs( repo )
  };
};