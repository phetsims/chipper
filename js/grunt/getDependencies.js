// Copyright 2017, University of Colorado Boulder

/**
 * Creates an object that stores information about all dependencies (including their SHAs and current branches)
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

const assert = require( 'assert' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const execute = require( './execute' );
const getPhetLibs = require( './getPhetLibs' );

module.exports = async function( grunt, repo ) {

  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );
  const version = packageObject.version;

  // Accumulate depencies for all brands
  const dependencies = getPhetLibs( grunt, repo ).filter( dependency => dependency !== 'babel' ); // Remove babel since it should be kept at master

  grunt.log.debug( 'Scanning dependencies from:\n' + dependencies.toString() );

  const dependenciesInfo = {
    comment: `# ${repo} ${version} ` + ( new Date().toString() )
  };

  for ( let dependency of dependencies ) {
    assert( !dependenciesInfo.dependency, 'there was already a dependency named ' + dependency );

    var sha = ( await execute( grunt, 'git', [ 'rev-parse', 'HEAD' ], `../${dependency}` ) ).trim();
    var branch = ( await execute( grunt, 'git', [ 'rev-parse', '--abbrev-ref', 'HEAD' ], `../${dependency}` ) ).trim();

    grunt.log.debug( ChipperStringUtils.padString( dependency, 20 ) + branch + ' ' + sha );
    dependenciesInfo[ dependency ] = { sha, branch };
  }

  return dependenciesInfo;
};
