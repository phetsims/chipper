// Copyright 2026, University of Colorado Boulder

/**
 * Creates an object that stores information about a specific build (buildInfo.json).
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import fsPromises from 'fs/promises';
import execute from '../../../perennial-alias/js/common/execute.js';
import { BuildInfoJSON } from '../../../perennial-alias/js/browser-and-node/PerennialTypes.js';
import getPhetLibs from './getPhetLibs.js';

export const getBuildInfoJSON = async (
  repo: string
): Promise<BuildInfoJSON> => {
  return {
    name: repo,
    version: JSON.parse( await fsPromises.readFile( `../${repo}/package.json`, 'utf8' ) ).version,
    date: new Date().toString(),
    totalitySHA: ( await execute( 'git', [ 'rev-parse', 'HEAD' ], '..' ) ).trim(),
    babelSHA: ( await execute( 'git', [ 'rev-parse', 'HEAD' ], '../babel' ) ).trim(),
    dependencyDirectories: getPhetLibs( repo )
  };
};