// Copyright 2017, University of Colorado Boulder

/**
 * TODO doc
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

const getThirdPartyLibEntries = require( './getThirdPartyLibEntries' );
const grunt = require( 'grunt' );

/**
 * TODO: doc, and naming differences
 *
 * NOTE: This pulls entries from some of the chipper globals. Should be done only after thie build
 *
 * @param {string} repo
 * @param {string} brand
 */
module.exports = function( repo, brand ) {
  // License entries for third-party media files that were loaded by media plugins.
  // The media plugins populate global.phet.chipper.licenseEntries.
  const thirdPartyEntries = {
    lib: getThirdPartyLibEntries( repo, brand )
  };
  if ( global.phet.chipper.licenseEntries ) {
    for ( const mediaType in global.phet.chipper.licenseEntries ) {
      if ( global.phet.chipper.licenseEntries.hasOwnProperty( mediaType ) ) {

        const mediaEntry = global.phet.chipper.licenseEntries[ mediaType ];

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
                grunt.log.error( 'No license.json entry for ' + resourceName );
              }
            }
            else if ( licenseEntry.projectURL !== 'https://phet.colorado.edu' ) {
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
