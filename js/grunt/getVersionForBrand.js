// Copyright 2015, University of Colorado Boulder

/**
 * Gets the version name based on the brand.  If the brand is phet-io, then the substring 'phetio' is
 * inserted into the version name at the appropriate place.
 *
 * see https://github.com/phetsims/chipper/issues/507
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

/**
 * @param {string} brand - the name of the brand
 * @param {string} version - the version string in package.json
 * @return {string} the updated version name
 */
module.exports = function( brand, version ) {
  'use strict';

  // RED ALERT: this is duplicated in packageJSON.js
  if ( brand === 'phet-io' ) {

    // Insert phetio into the version name
    // 1.2.0-dev.31 => 1.2.0-phetiodev.31
    // 1.2.0 => 1.2.0-phetio

    // if there is a hyphen, put phetio before it
    // if there is no hyphen, append phetio
    var hyphenIndex = version.indexOf( '-' );
    if ( hyphenIndex >= 0 ) {
      return version.substring( 0, hyphenIndex + 1 ) + 'phetio' + version.substring( hyphenIndex + 1 );
    }
    else {
      return version + '-phetio';
    }
  }
  return version;
};