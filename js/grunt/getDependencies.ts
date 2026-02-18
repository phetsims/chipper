// Copyright 2017-2026, University of Colorado Boulder

/**
 * Creates an object that stores information about all dependencies (including their SHAs and current branches)
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import assert from 'assert';
import { readFileSync } from 'fs';
import execute from '../../../perennial-alias/js/common/execute.js';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';
import ChipperStringUtils from '../common/ChipperStringUtils.js';
import getPhetLibs from './getPhetLibs.js';

// Our definition of an allowed simName is defined in the buildServer: https://github.com/phetsims/perennial/blob/78025b7ae6064e9ab5260cea5e532f3bf24c3ec8/js/build-server/taskWorker.js#L99-L98
// We don't want to be this strict though, because 3rd parties are allowed to name sims to be whatever they want. So
// for the purposes of dependencies, we just need to make sure it is a name, and not a path.
const simNameRegex = /^[^/]+$/;

/**
 * Returns an object in the dependencies.json format. Keys are repo names (or 'comment'). Repo keys have 'sha' and 'branch' fields.
 *
 * @returns - In the dependencies.json format. JSON.stringify if you want to output to a file
 */
export default async function getDependencies( repo: string ): Promise<object> {

  const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );
  const version = packageObject.version;

  // Accumulate dependencies for all brands
  const dependencies: string[] = getPhetLibs( repo ).filter( dependency => dependency !== 'babel' ); // Remove babel since it should be kept at main

  // We need to check dependencies for the main brand, so we can know what is guaranteed to be public
  const mainDependencies = getPhetLibs( repo, 'phet' ).filter( dependency => dependency !== 'babel' );

  grunt.log.verbose.writeln( `Scanning dependencies from:\n${dependencies.toString()}` );

  const dependenciesInfo: Record<string, unknown> = {
    comment: `# ${repo} ${version} ${new Date().toString()}`
  };

  for ( const dependency of dependencies ) {
    assert( !dependenciesInfo.dependency, `there was already a dependency named ${dependency}` );

    if ( !simNameRegex.test( dependency ) ) {
      throw new Error( `Dependency name is not valid: ${dependency}` );
    }
    else if ( !grunt.file.exists( `../${dependency}` ) ) {
      if ( mainDependencies.includes( dependency ) ) {
        throw new Error( `Dependency not found: ${dependency}` );
      }

      // NOTE NOTE NOTE: This error message is checked for on the perennial build side (it will fail the build). Do NOT change this without changing that.
      grunt.log.warn( `WARNING404: Skipping potentially non-public dependency ${dependency}` );
      continue;
    }

    let sha = null;
    let branch = null;

    try {
      sha = ( await execute( 'git', [ 'rev-parse', 'HEAD' ], `../${dependency}` ) ).trim();
      branch = ( await execute( 'git', [ 'rev-parse', '--abbrev-ref', 'HEAD' ], `../${dependency}` ) ).trim();
    }
    catch( e ) {
      // We support repos that are not git repositories, see https://github.com/phetsims/chipper/issues/1011
      console.log( `Did not find git information for ${dependency}` );
    }

    grunt.log.verbose.writeln( `${ChipperStringUtils.padString( dependency, 20 ) + branch} ${sha}` );
    dependenciesInfo[ dependency ] = { sha: sha, branch: branch };
  }

  return dependenciesInfo;
}