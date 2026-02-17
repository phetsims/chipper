// Copyright 2017-2024, University of Colorado Boulder

/**
 * Gets the license keys for sherpa (third-party) libs that are used.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import { readFileSync } from 'fs';
import _ from 'lodash';
import webpackGlobalLibraries from '../common/webpackGlobalLibraries.js';
import getPreloads from './getPreloads.js';

/**
 * Gets the license keys for sherpa (third-party) libs that are used.
 */
export default function getLicenseKeys( repo: string, brand: string ): string[] {
  const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );
  let buildObject;
  try {
    buildObject = JSON.parse( readFileSync( '../chipper/build.json', 'utf8' ) );
  }
  catch( e ) {
    buildObject = {};
  }
  const preload = getPreloads( repo, brand, false );

  // start with package.json
  let licenseKeys: string[] = packageObject.phet.licenseKeys || [];

  // add common and brand-specific entries from build.json
  [ 'common', brand ].forEach( id => {
    if ( buildObject[ id ] && buildObject[ id ].licenseKeys ) {
      licenseKeys = licenseKeys.concat( buildObject[ id ].licenseKeys );
    }
  } );

  // Extract keys from preloads and webpack-supported imports for
  // sherpa (third-party) dependencies.
  const allPaths: string[] = preload.concat( Object.values( webpackGlobalLibraries ).map( path => `../${path}` ) );

  allPaths.forEach( path => {
    if ( path.includes( '/sherpa/' ) ) {
      const lastSlash = path.lastIndexOf( '/' );
      const key = path.substring( lastSlash + 1 );
      licenseKeys.push( key );
    }
  } );

  // sort and remove duplicates
  return _.uniq( _.sortBy( licenseKeys, ( key: string ) => key.toUpperCase() ) );
}