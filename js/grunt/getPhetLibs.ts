// Copyright 2017-2026, University of Colorado Boulder

/**
 * Determines a list of all dependent repositories (for dependencies.json or other creation)
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import { readFileSync } from 'fs';
import _ from 'lodash';
import ChipperConstants from '../common/ChipperConstants.js';

/**
 * Returns a list of all dependent repositories.
 *
 * @param repo
 * @param [brand] - If not specified, it will return the dependencies for all brands.
 */
export default function getPhetLibs( repo: string, brand?: string | string[] ): string[] {

  if ( brand === undefined || brand.length === 0 ) {
    return getPhetLibs( repo, ChipperConstants.BRANDS );
  }
  else if ( Array.isArray( brand ) ) {
    return _.reduce( brand, ( dependencies: string[], brand ) => {
      return _.uniq( dependencies.concat( getPhetLibs( repo, brand ) ).sort() );
    }, [] );
  }
  else {
    const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );
    let buildObject;
    try {
      buildObject = JSON.parse( readFileSync( '../chipper/build.json', 'utf8' ) );
    }
    catch( e ) {
      buildObject = {};
    }

    // start with package.json
    let phetLibs = packageObject &&
                   packageObject.phet &&
                   packageObject.phet.phetLibs ?
                   packageObject.phet.phetLibs : [];

    // add the repo that's being built
    phetLibs.push( packageObject.name );

    // add common and brand-specific entries from build.json
    [ 'common', brand ].forEach( id => {
      if ( buildObject[ id ] && buildObject[ id ].phetLibs ) {
        phetLibs = phetLibs.concat( buildObject[ id ].phetLibs );
      }
    } );

    // add brand specific dependencies from the package json
    if ( packageObject.phet && packageObject.phet[ brand ] && packageObject.phet[ brand ].phetLibs ) {
      phetLibs = phetLibs.concat( packageObject.phet[ brand ].phetLibs );
    }

    // wrappers are also marked as phetLibs, so we can get their shas without listing them twice
    if ( brand === 'phet-io' && packageObject.phet && packageObject.phet[ brand ] && packageObject.phet[ brand ].wrappers ) {
      const wrapperRepos = ( packageObject.phet[ brand ].wrappers ).filter( ( wrapper: string ) => !wrapper.includes( '/' ) );
      phetLibs = phetLibs.concat( wrapperRepos );
    }

    // sort and remove duplicates
    return _.uniq( phetLibs.sort() );
  }
}