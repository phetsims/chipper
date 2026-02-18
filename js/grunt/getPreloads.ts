// Copyright 2017-2026, University of Colorado Boulder

/**
 * Gets preload, the set of scripts to be preloaded in the .html file.
 * NOTE! Order of the return value is significant, since it corresponds to the order in which scripts will be preloaded.
 *
 * @param repo
 * @param brand
 * @param [forSim] - if the preloads are specifically for a simulation
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import assert from 'assert';
import { readFileSync } from 'fs';
import _ from 'lodash';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';
import ChipperStringUtils from '../common/ChipperStringUtils.js';
import getPhetLibs from './getPhetLibs.js';

export default function getPreloads( repo: string, brand: string, forSim: boolean ): string[] {

  const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );
  let buildObject;
  try {
    const buildString = grunt.file.read( '../chipper/build.json' );
    const filledInBuildString = ChipperStringUtils.replaceAll( buildString, '{{REPO}}', repo );
    buildObject = JSON.parse( filledInBuildString );
  }
  catch( e ) {
    buildObject = {};
  }

  let preload: string[] = [];

  // add preloads that are common to all sims, from build.json
  if ( buildObject.common && buildObject.common.preload ) {
    assert( Array.isArray( buildObject.common.preload ), 'preload should be an array' );
    preload = preload.concat( buildObject.common.preload );
  }

  // add sim-specific preloads from package.json
  if ( packageObject.phet.preload ) {
    assert( Array.isArray( packageObject.phet.preload ), 'preload should be an array' );
    preload = preload.concat( packageObject.phet.preload );
  }

  // add brand-specific preloads from build.json
  if ( buildObject[ brand ] && buildObject[ brand ].preload ) {
    assert( Array.isArray( buildObject[ brand ].preload ), 'preload should be an array' );
    preload = preload.concat( buildObject[ brand ].preload );
  }

  // simulationSpecificPreload are not needed for any other runtimes, like tests
  // No need to support this for package.json, just in chipper for now.
  if ( forSim && buildObject[ brand ] && buildObject[ brand ].simulationSpecificPreload ) {
    preload = preload.concat( buildObject[ brand ].simulationSpecificPreload );
  }

  // add brand-specific preloads from package.json
  if ( packageObject.phet[ brand ] && packageObject.phet[ brand ].preload ) {
    assert( Array.isArray( packageObject.phet[ brand ].preload ), 'preload should be an array' );
    preload = preload.concat( packageObject.phet[ brand ].preload );
  }

  // remove duplicates (do NOT sort, order is significant!)
  preload = _.uniq( preload );

  // Verifies that preload repositories are included in phetLib.
  const phetLibs = getPhetLibs( repo, brand );
  const missingRepositories: string[] = [];
  preload.forEach( entry => {

    // preload entries should start with '..', e.g. "../assert/js/assert.js"
    assert( entry.split( '/' )[ 0 ] === '..', `malformed preload entry: ${entry}` );

    // the preload's repository should be in phetLib
    const repositoryName = entry.split( '/' )[ 1 ];
    if ( !phetLibs.includes( repositoryName ) && !missingRepositories.includes( repositoryName ) ) {
      missingRepositories.push( repositoryName );
    }
  } );
  assert( missingRepositories.length === 0,
    `phetLib is missing repositories required by preload: ${missingRepositories.toString()}` );

  return preload;
}