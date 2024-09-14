// Copyright 2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const assert = require( 'assert' );
const grunt = require( 'grunt' );

const parseGruntOptions = require( './parseGruntOptions' );

// Initialize Grunt options with parsed arguments
grunt.option.init( parseGruntOptions() );

const getBrands = ( grunt, repo, buildLocal ) => {

  // Determine what brands we want to build
  assert( !grunt.option( 'brand' ), 'Use --brands={{BRANDS}} instead of brand' );

  const localPackageObject = grunt.file.readJSON( `../${repo}/package.json` );
  const supportedBrands = localPackageObject.phet.supportedBrands || [];

  let brands;
  if ( grunt.option( 'brands' ) ) {
    if ( grunt.option( 'brands' ) === '*' ) {
      brands = supportedBrands;
    }
    else {
      brands = grunt.option( 'brands' ).split( ',' );
    }
  }
  else if ( buildLocal.brands ) {
    // Extra check, see https://github.com/phetsims/chipper/issues/640
    assert( Array.isArray( buildLocal.brands ), 'If brands exists in build-local.json, it should be an array' );
    brands = buildLocal.brands.filter( brand => supportedBrands.includes( brand ) );
  }
  else {
    brands = [ 'adapted-from-phet' ];
  }

  // Ensure all listed brands are valid
  brands.forEach( brand => assert( supportedBrands.includes( brand ), `Unsupported brand: ${brand}` ) );

  return brands;
};

module.exports = getBrands;