// Copyright 2015, University of Colorado Boulder

/**
 * Gets the version name based on the brand.  If the brand is phet-io, then the substring 'phetio' is
 * inserted into the version name at the appropriate place.  UMD allows this file to be called from node (chipper) and
 * from the browser (simulation).
 *
 * see https://github.com/phetsims/chipper/issues/507
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
(function( root, factory ) {
  'use strict';

  if ( typeof define === 'function' && define.amd ) {

    // AMD. Register as an anonymous module.
    define( [], factory );
  }
  else if ( typeof module === 'object' && module.exports ) {

    // Node. Does not work with strict CommonJS, but only CommonJS-like environments that support module.exports, like Node.
    module.exports = factory();
  }
  else {

    // Browser globals (root is window)
    root.getVersionForBrand = factory();
  }
}( this, function() {
  'use strict';

  /**
   * @param {string} brand - the name of the brand
   * @param {string} version - the version string in package.json
   * @returns {string} the updated version name
   */
  return function( brand, version ) {
    // TODO: just use brandToSuffix
    if ( brand === 'phet-io' ) {
      brand = 'phetio';
    }
    else {
      brand = brand.split( '-' ).map( function( bit, index ) {
        return ( index > 0 ? bit[ 0 ].toUpperCase() : bit[ 0 ] ) + bit.slice( 1 );
      } ).join( '' );
    }

    return version + '-' + brand;
  };
} ));