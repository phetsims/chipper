// Copyright 2015-2016, University of Colorado Boulder

/**
 * Creates a composite report of all of the 3rd party images, code, sounds and other media used by all of the published
 * PhET Simulations. The reports is published at: https://github.com/phetsims/sherpa/blob/master/third-party-licenses.md
 *
 * Usage:
 * grunt report-third-party
 * // then push sherpa/third-party-licenses.md
 *
 * Third party entries are parsed from the HTML files for all simulations published on the PhET website.
 * See getLicenseEntry.js for documentation of the fields in the entries.
 *
 * Copy the local-auth-code key value from phet-server:/etc/tomcat/context.xml into the value for
 * websiteAuthorizationCode in ~/.phet/build-local.json
 *
 * @author Sam Reid
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const assert = require( 'assert' );
const ChipperConstants = require( '../common/ChipperConstants' );
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const https = require( 'https' );
const rp = require( 'request-promise-native' ); // eslint-disable-line require-statement-match

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * @returns {Promise} - Resolves when complete.
 */
module.exports = async function() {

  // read configuration file - required to write to website database
  const serverName = 'phet.colorado.edu';
  const BUILD_LOCAL_FILENAME = process.env.HOME + '/.phet/build-local.json';
  const buildLocalJSON = JSON.parse( fs.readFileSync( BUILD_LOCAL_FILENAME, { encoding: 'utf-8' } ) );
  assert( buildLocalJSON && buildLocalJSON.websiteAuthorizationCode, 'websiteAuthorizationCode missing from ' + BUILD_LOCAL_FILENAME );

  // The file where the report will be written
  const outputFilename = '../sherpa/third-party-licenses.md';

  // Aggregate results for each of the license types
  const compositeCode = {};
  const compositeMedia = {};

  // List of all of the repository names, so that we can detect which libraries are used by all-sims
  const simTitles = [];

  // List of libraries for each sim
  // Type: string in JSON format
  const simLibraries = [];

  // Download all sims. If it's not published, it will be skipped in the report
  // TODO: don't use this from chipper!
  const activeSims = fs.readFileSync( '../perennial/data/active-sims', 'utf-8' ).trim().split( '\n' ).map( sim => sim.trim() );

  for ( const sim of activeSims ) {
    const url = `https://${serverName}/sims/html/${sim}/latest/${sim}_en.html`;
    console.log( `downloading ${sim}` );
    try {
      const html = ( await rp( url ) ).trim();

      const startIndex = html.indexOf( ChipperConstants.START_THIRD_PARTY_LICENSE_ENTRIES );
      const endIndex = html.indexOf( ChipperConstants.END_THIRD_PARTY_LICENSE_ENTRIES );
      const substring = html.substring( startIndex, endIndex );

      const firstCurlyBrace = substring.indexOf( '{' );
      const lastCurlyBrace = substring.lastIndexOf( '}' );
      const jsonString = substring.substring( firstCurlyBrace, lastCurlyBrace + 1 );

      const json = JSON.parse( jsonString );

      let title = parseTitle( html );
      if ( !title || title.indexOf( 'undefined' ) === 0 || title.indexOf( 'TITLE' ) >= 0 ) {
        grunt.log.writeln( `title not found for ${sim}` );
        title = sim;
      }
      augment( title, json.lib, compositeCode );
      augment( title, json.sounds, compositeMedia );
      augment( title, json.images, compositeMedia );

      simTitles.push( title );

      // Concatenate all the libraries for this sim with html newline.
      let libString = '';
      for ( const entry in json.lib ) {
        libString += entry + '<br/>';
      }

      //  Update the object to be pushed to the website database
      simLibraries.push( {
        name: sim,
        libraries: libString
      } );
    }
    catch( e ) {
      console.log( `${sim} not found on production` );
    }
  }

  const requestPromise = new Promise( ( resolve, reject ) => {
    // Change libraryobject to string in format that the database will recognize.
    // i.e. '{"sim-name":"Library Name<br/>Library Name", ...}'   
    const libraryString = '{' + simLibraries.map( o => `"${o.name}":"${o.libraries}"` ).join( ',' ) + '}';

    const requestOptions = {
      host: serverName,
      path: '/services/add-simulation-libraries',
      port: 443,
      method: 'POST',
      auth: 'token:' + buildLocalJSON.websiteAuthorizationCode,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength( libraryString )
      }
    };

    const request = https.request( requestOptions, res => resolve( res ) );
    request.on( 'error', function( e ) {
      grunt.log.writeln( 'There was a problem uploading the data to the website: ' + e.message );
      reject( e );
    } );

    // write data to request body
    request.write( libraryString );

    request.end();
  } );

  grunt.log.writeln( 'Sending license data to /services/add-simulation-libraries' );
  await requestPromise;
  grunt.log.writeln( 'Sending data complete' );

  // Sort to easily compare lists of repositoryNames with usedBy columns, to see which resources are used by everything.
  simTitles.sort();

  // If anything is used by every sim indicate that here
  for ( const entry in compositeCode ) {
    if ( compositeCode.hasOwnProperty( entry ) ) {
      compositeCode[ entry ].usedBy.sort();
      if ( _.isEqual( simTitles, compositeCode[ entry ].usedBy ) ) {
        compositeCode[ entry ].usedBy = 'all-sims'; // this is an annotation, not the vestigial all-sims repo
      }
    }
  }

  const licenseJSON = grunt.file.readJSON( '../sherpa/lib/license.json' );

  const codeOutput = [];
  const codeLicensesUsed = [];
  const mediaLicensesUsed = [];

  // Get a list of the library names
  const libraryNames = [];
  for ( const lib in licenseJSON ) {
    if ( licenseJSON.hasOwnProperty( lib ) ) {
      libraryNames.push( lib );
    }
  }

  // Use a case insensitive sort, see http://stackoverflow.com/questions/8996963/how-to-perform-case-insensitive-sorting-in-javascript
  libraryNames.sort( function( a, b ) {
    return a.toLowerCase().localeCompare( b.toLowerCase() );
  } );

  // Add info for each library to the MD report
  for ( let i = 0; i < libraryNames.length; i++ ) {
    const library = libraryNames[ i ];

    const lineElementsForLibrary = [
      '**' + library + '**',
      licenseJSON[ library ].text.join( '<br>' ),
      licenseJSON[ library ].projectURL,
      'License: [' + licenseJSON[ library ].license + '](licenses/' + library + '.txt)',
      'Notes: ' + licenseJSON[ library ].notes
    ];

    if ( licenseJSON[ library ].dependencies ) {
      lineElementsForLibrary.push( 'Dependencies: **' + licenseJSON[ library ].dependencies + '**' );
    }

    if ( compositeCode.hasOwnProperty( library ) && Array.isArray( compositeCode[ library ].usedBy ) ) {
      lineElementsForLibrary.push( 'Used by: ' + compositeCode[ library ].usedBy.join( ', ' ) );
    }

    // \n worked well when viewing GitHub markdown as an issue comment, but for unknown reasons <br> is necessary when
    // viewing from https://github.com/phetsims/sherpa/blob/master/third-party-licenses.md
    codeOutput.push( lineElementsForLibrary.join( '<br>' ) );

    if ( codeLicensesUsed.indexOf( licenseJSON[ library ].license ) < 0 ) {
      codeLicensesUsed.push( licenseJSON[ library ].license );
    }
  }

  const mediaOutput = [];
  const mediaKeys = [];
  for ( const imageAudioEntry in compositeMedia ) {
    if ( compositeMedia.hasOwnProperty( imageAudioEntry ) ) {
      mediaKeys.push( imageAudioEntry );
    }
  }
  // Use a case insensitive sort, see http://stackoverflow.com/questions/8996963/how-to-perform-case-insensitive-sorting-in-javascript
  mediaKeys.sort( function( a, b ) {
    return a.toLowerCase().localeCompare( b.toLowerCase() );
  } );

  // Create the text for the image and sound, and keep track of which licenses were used by them.
  for ( let i = 0; i < mediaKeys.length; i++ ) {
    const mediaKey = mediaKeys[ i ];

    let text = compositeMedia[ mediaKey ].text.join( '<br>' ).trim();
    let projectURL = compositeMedia[ mediaKey ].projectURL.trim();

    if ( text.length === 0 ) {
      text = '(no text)';
    }

    if ( projectURL.length === 0 ) {
      projectURL = '(no project url)';
    }

    let notes = compositeMedia[ mediaKey ].notes.trim();
    if ( notes.length === 0 ) {
      notes = '(no notes)';
    }

    const license = compositeMedia[ mediaKey ].license.trim();
    assert && assert( license.length > 0, 'All media entries must have a license' );

    const mediaEntryLines = [
      '**' + mediaKey + '**',
      text,
      projectURL,
      'License: ' + license,
      'Notes: ' + notes
    ];

    // PhET has temporarily chosen to publish John Travoltage with incompatible licenses, so the reasons for
    // making the exceptions are noted here.  The new artwork is being developed now and the simulation
    // will be republished without exception cases soon.
    // This code will remain in case we have other exception cases in the future.
    if ( compositeMedia[ mediaKey ].exception ) {
      mediaEntryLines.push( 'Exception: ' + compositeMedia[ mediaKey ].exception );
    }

    // TODO: is this a real license?  Why is there logic here but nowhere else?  Perhaps files annotated with
    // contact phethelp@colorado.edu are leaking into the HTML files unnecessarily
    if ( license !== 'contact phethelp@colorado.edu' ) {
      mediaOutput.push( mediaEntryLines.join( '<br>' ) );

      if ( mediaLicensesUsed.indexOf( license ) < 0 ) {
        mediaLicensesUsed.push( license );
      }
    }
  }

  // Summarize licenses used
  const fileList = simTitles.join( '\n* ' );

  const outputString =
    'This report enumerates the third-party resources (code, images, sounds, etc) used in a set of simulations.\n' +
    '* [Third-party Code](#third-party-code)\n' +
    '* [Third-party Code License Summary](#third-party-code-license-summary)\n' +
    '* [Third-party Media](#third-party-media)\n' +
    '* [Third-party Media License Summary](#third-party-media-license-summary)\n' +
    '\n' +
    'This report is for the following simulations: \n\n* ' + fileList + '\n\nTo see the third party resources used in a particular published ' +
    'simulation, inspect the HTML file between the `' + ChipperConstants.START_THIRD_PARTY_LICENSE_ENTRIES + '` and `' + ChipperConstants.END_THIRD_PARTY_LICENSE_ENTRIES + '` ' +
    '(only exists in sim publications after Aug 7, 2015).\n' +
    '# <a name="third-party-code"></a>Third-party Code:<br>\n' +
    codeOutput.join( '\n\n' ) + '\n\n' +

    '---\n' +

    '# <a name="third-party-code-and-license-summary"></a>Third-party Code License Summary:<br>\n' +
    codeLicensesUsed.join( '<br>' ) + '\n\n' +

    '---\n' +

    '# <a name="third-party-media"></a>Third-party Media:<br>\n' +
    mediaOutput.join( '\n\n' ) + '\n\n' +

    '---\n' +

    '# <a name="third-party-media-license-summary"></a>Third-party Media License Summary:<br>\n' +
    mediaLicensesUsed.join( '<br>' ) + '\n\n';

  // Compare the file output to the existing file, and write & git commit only if different
  if ( !grunt.file.exists( outputFilename ) || grunt.file.read( outputFilename ) !== outputString ) {
    grunt.log.writeln( 'File output changed, writing file ' + outputFilename );
    grunt.file.write( outputFilename, outputString );
  }
  else {
    grunt.log.writeln( outputFilename + ' contents are the same.  No need to save.' );
  }

  /**
   * Given an HTML text, find the title attribute by parsing for <title>
   * @param {string} html
   * @returns {string}
   */
  function parseTitle( html ) {
    const startKey = '<title>';
    const endKey = '</title>';

    const startIndex = html.indexOf( startKey );
    const endIndex = html.indexOf( endKey );

    return html.substring( startIndex + startKey.length, endIndex ).trim();
  }

  /**
   * Add the source (images/sounds/media or code) entries to the destination object, keyed by name.
   * @param {string} repositoryName - the name of the repository, such as 'energy-skate-park-basics'
   * @param {Object} source - the object from which to read the entry
   * @param {Object} destination - the object to which to append the entry
   */
  function augment( repositoryName, source, destination ) {
    for ( const entry in source ) {
      if ( source.hasOwnProperty( entry ) ) {
        if ( !destination.hasOwnProperty( entry ) ) {
          destination[ entry ] = source[ entry ];//overwrites
          destination[ entry ].usedBy = [];
        }
        destination[ entry ].usedBy.push( repositoryName );
      }
    }
  }
};