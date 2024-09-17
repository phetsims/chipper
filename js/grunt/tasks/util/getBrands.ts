// Copyright 2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
// @ts-expect-error
import assert from 'assert';
import IntentionalAny from '../../../../../phet-core/js/types/IntentionalAny.js';
import getOption from './getOption';

const getBrands = ( grunt: IntentionalAny, repo: string, buildLocal: IntentionalAny ) => {

  // Determine what brands we want to build
  assert( !getOption( 'brand' ), 'Use --brands={{BRANDS}} instead of brand' );

  const localPackageObject = grunt.file.readJSON( `../${repo}/package.json` );
  const supportedBrands = localPackageObject.phet.supportedBrands || [];

  let brands: string[];
  if ( getOption( 'brands' ) ) {
    if ( getOption( 'brands' ) === '*' ) {
      brands = supportedBrands;
    }
    else {
      brands = getOption( 'brands' ).split( ',' );
    }
  }
  else if ( buildLocal.brands ) {
    // Extra check, see https://github.com/phetsims/chipper/issues/640
    assert( Array.isArray( buildLocal.brands ), 'If brands exists in build-local.json, it should be an array' );
    brands = buildLocal.brands.filter( ( brand: string ) => supportedBrands.includes( brand ) );
  }
  else {
    brands = [ 'adapted-from-phet' ];
  }

  // Ensure all listed brands are valid
  brands.forEach( brand => assert( supportedBrands.includes( brand ), `Unsupported brand: ${brand}` ) );

  return brands;
};

module.exports = getBrands;