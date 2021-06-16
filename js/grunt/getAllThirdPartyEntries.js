// Copyright 2017-2021, University of Colorado Boulder

/**
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

const getThirdPartyLibEntries = require( './getThirdPartyLibEntries' );
const grunt = require( 'grunt' );

/**
 * Returns an object with information about third-party license entries.
 *
 * NOTE: This pulls entries from some of the chipper globals. Should be done only after the build
 *
 * @param {string} repo
 * @param {string} brand
 * @param {Object} licenseEntries
 */
module.exports = function( repo, brand, licenseEntries ) {
  const thirdPartyEntries = {
    lib: getThirdPartyLibEntries( repo, brand )
  };
  if ( licenseEntries ) {
    for ( const mediaType in licenseEntries ) {
      if ( licenseEntries.hasOwnProperty( mediaType ) ) {

        const mediaEntry = licenseEntries[ mediaType ];

        // For each resource of that type
        for ( const resourceName in mediaEntry ) {
          if ( mediaEntry.hasOwnProperty( resourceName ) ) {

            const licenseEntry = mediaEntry[ resourceName ];

            // If it is not from PhET, it is from a 3rd party and we must include it in the report
            // But lift this restriction when building a non-phet brand
            if ( !licenseEntry ) {

              // Fail if there is no license entry.  Though this error should have been caught
              if ( brand === 'phet' || brand === 'phet-io' ) {
                // during plugin loading, so this is a "double check"
                grunt.log.error( `No license.json entry for ${resourceName}` );
              }
            }
            else if ( licenseEntry.projectURL !== 'https://phet.colorado.edu' &&
                      licenseEntry.projectURL !== 'http://phet.colorado.edu' ) {
              thirdPartyEntries[ mediaType ] = thirdPartyEntries[ mediaType ] || {};
              thirdPartyEntries[ mediaType ][ resourceName ] = licenseEntry;
            }
          }
        }
      }
    }
  }

  return thirdPartyEntries;
};
