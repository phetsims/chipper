// Copyright 2017, University of Colorado Boulder

/**
 * Creates an object that stores information about all dependencies (including their SHAs and current branches)
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

const assert = require( 'assert' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const execute = require( './execute' );
const getPhetLibs = require( './getPhetLibs' );
const grunt = require( 'grunt' );

/**
 * Returns an object in the dependencies.json format. Keys are repo names (or 'comment'). Repo keys have 'sha' and 'branch' fields.
 * @public
 *
 * @param {string} repo
 * @returns {Promise.<Object>} - In the dependencies.json format. JSON.stringify if you want to output to a file
 */
module.exports = async function( repo ) {

  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );
  const version = packageObject.version;

  // Accumulate dependencies for all brands
  const dependencies = getPhetLibs( repo ).filter( dependency => dependency !== 'babel' ); // Remove babel since it should be kept at master

  // We need to check dependencies for the main brand, so we can know what is guaranteed to be public
  const mainDependencies = getPhetLibs( repo, 'phet' ).filter( dependency => dependency !== 'babel' );

  grunt.log.debug( 'Scanning dependencies from:\n' + dependencies.toString() );

  const dependenciesInfo = {
    comment: `# ${repo} ${version} ` + ( new Date().toString() )
  };

  for ( const dependency of dependencies ) {
    assert( !dependenciesInfo.dependency, 'there was already a dependency named ' + dependency );

    if ( !grunt.file.exists( `../${dependency}` ) ) {
      if ( mainDependencies.includes( dependency ) ) {
        throw new Error( `Dependency not found: ${dependency}` );
      }

      // NOTE NOTE NOTE: This error message is checked for on the perennial build side (it will fail the build). Do NOT change this without changing that.
      grunt.log.warn( `WARNING404: Skipping potentially non-public dependency ${dependency}` );
      continue;
    }

    const sha = ( await execute( 'git', [ 'rev-parse', 'HEAD' ], { cwd: `../${dependency}` } ) ).trim();
    const branch = ( await execute( 'git', [ 'rev-parse', '--abbrev-ref', 'HEAD' ], { cwd: `../${dependency}` } ) ).trim();

    grunt.log.debug( ChipperStringUtils.padString( dependency, 20 ) + branch + ' ' + sha );
    dependenciesInfo[ dependency ] = { sha: sha, branch: branch };
  }

  return dependenciesInfo;
};
