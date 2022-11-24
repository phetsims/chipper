// Copyright 2015-2016, University of Colorado Boulder

/**
 * Creates a composite report of all of the 3rd party images, code, audio and other media used by all of the published
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
/* eslint-env node */
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
  assert ( buildLocalJSON && buildLocalJSON.websiteAuthorizationCode, 'websiteAuthorizationCode missing from ' + BUILD_LOCAL_FILENAME);

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
  const activeSims = [ 'acid-base-solutions', 'area-builder', 'area-model-algebra', 'area-model-decimals', 'area-model-introduction', 'area-model-multiplication', 'arithmetic', 'atomic-interactions', 'balancing-act', 'balancing-chemical-equations', 'balloons-and-static-electricity', 'beers-law-lab', 'bending-light', 'blackbody-spectrum', 'blast', 'build-a-fraction', 'build-a-molecule', 'build-a-nucleus', 'build-an-atom', 'bumper', 'buoyancy', 'calculus-grapher', 'capacitor-lab-basics', 'center-and-variability', 'chains', 'charges-and-fields', 'circuit-construction-kit-ac', 'circuit-construction-kit-ac-virtual-lab', 'circuit-construction-kit-black-box-study', 'circuit-construction-kit-dc', 'circuit-construction-kit-dc-virtual-lab', 'collision-lab', 'color-vision', 'concentration', 'coulombs-law', 'curve-fitting', 'density', 'diffusion', 'eating-exercise-and-energy', 'energy-forms-and-changes', 'energy-skate-park', 'energy-skate-park-basics', 'equality-explorer', 'equality-explorer-basics', 'equality-explorer-two-variables', 'estimation', 'example-sim', 'expression-exchange', 'faradays-law', 'fluid-pressure-and-flow', 'forces-and-motion-basics', 'fourier-making-waves', 'fraction-comparison', 'fraction-matcher', 'fractions-equality', 'fractions-intro', 'fractions-mixed-numbers', 'friction', 'function-builder', 'function-builder-basics', 'gas-properties', 'gases-intro', 'gene-expression-essentials', 'geometric-optics', 'geometric-optics-basics', 'graphing-lines', 'graphing-quadratics', 'graphing-slope-intercept', 'gravity-and-orbits', 'gravity-force-lab', 'gravity-force-lab-basics', 'greenhouse-effect', 'hookes-law', 'interaction-dashboard', 'isotopes-and-atomic-mass', 'john-travoltage', 'least-squares-regression', 'make-a-ten', 'masses-and-springs', 'masses-and-springs-basics', 'mean-share-and-balance', 'models-of-the-hydrogen-atom', 'molarity', 'molecule-polarity', 'molecule-shapes', 'molecule-shapes-basics', 'molecules-and-light', 'my-solar-system', 'natural-selection', 'neuron', 'normal-modes', 'number-compare', 'number-line-distance', 'number-line-integers', 'number-line-operations', 'number-play', 'ohms-law', 'optics-lab', 'pendulum-lab', 'ph-scale', 'ph-scale-basics', 'phet-io-test-sim', 'plinko-probability', 'projectile-motion', 'proportion-playground', 'quadrilateral', 'ratio-and-proportion', 'reactants-products-and-leftovers', 'resistance-in-a-wire', 'rutherford-scattering', 'simula-rasa', 'sound', 'states-of-matter', 'states-of-matter-basics', 'trig-tour', 'under-pressure', 'unit-rates', 'vector-addition', 'vector-addition-equations', 'wave-interference', 'wave-on-a-string', 'waves-intro', 'wilder', 'xray-diffraction' ];

  for ( let sim of activeSims ) {
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

      var title = parseTitle( html );
      if ( !title || title.indexOf( 'undefined' ) === 0 || title.indexOf( 'TITLE' ) >= 0 ) {
        grunt.log.writeln( `title not found for ${sim}` );
        title = sim;
      }
      augment( title, json.lib, compositeCode );
      augment( title, json.audio, compositeMedia );
      augment( title, json.images, compositeMedia );

      simTitles.push( title );

      // Concatenate all the libraries for this sim with html newline.
      let libString = '';
      for ( let entry in json.lib ) {
        libString += entry + '<br/>';
      }

      //  Update the object to be pushed to the website database
      simLibraries.push( {
        name: sim,
        libraries: libString
      } );
    }
    catch ( e ) {
      console.log( `${sim} not found on production` );
    }
  }

  const requestPromise = new Promise( ( resolve, reject ) => {
    // Change libraryobject to string in format that the database will recognize.
    // i.e. '{"sim-name":"Library Name<br/>Library Name", ...}'   
    const libraryString = '{' + simLibraries.map( o => `"${o.name}":"${o.simLibraries}"` ).join( ',' ) + '}';

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
  for ( var entry in compositeCode ) {
    if ( compositeCode.hasOwnProperty( entry ) ) {
      compositeCode[ entry ].usedBy.sort();
      if ( _.isEqual( simTitles, compositeCode[ entry ].usedBy ) ) {
        compositeCode[ entry ].usedBy = 'all-sims'; // this is an annotation, not the vestigial all-sims repo
      }
    }
  }

  var licenseJSON = grunt.file.readJSON( '../sherpa/lib/license.json' );

  var codeOutput = [];
  var codeLicensesUsed = [];
  var mediaLicensesUsed = [];

  // Get a list of the library names
  var libraryNames = [];
  for ( var lib in licenseJSON ) {
    if ( licenseJSON.hasOwnProperty( lib ) ) {
      libraryNames.push( lib );
    }
  }

  // Use a case insensitive sort, see http://stackoverflow.com/questions/8996963/how-to-perform-case-insensitive-sorting-in-javascript
  libraryNames.sort( function( a, b ) {
    return a.toLowerCase().localeCompare( b.toLowerCase() );
  } );

  // Add info for each library to the MD report
  for ( var i = 0; i < libraryNames.length; i++ ) {
    var library = libraryNames[ i ];

    var lineElementsForLibrary = [
      '**' + library + '**',
      licenseJSON[ library ].text.join( '<br>' ),
      licenseJSON[ library ].projectURL,
      'License: [' + licenseJSON[ library ].license + '](licenses/' + library + '.txt)',
      'Notes: ' + licenseJSON[ library ].notes
    ];

    if ( licenseJSON[ library ].dependencies ) {
      lineElementsForLibrary.push( 'Dependencies: **' + licenseJSON[ library ].dependencies + '**' );
    }

    if ( compositeCode.hasOwnProperty( library ) && compositeCode[ library ].usedBy instanceof Array ) {
      lineElementsForLibrary.push( 'Used by: ' + compositeCode[ library ].usedBy.join( ', ' ) );
    }

    // \n worked well when viewing GitHub markdown as an issue comment, but for unknown reasons <br> is necessary when
    // viewing from https://github.com/phetsims/sherpa/blob/master/third-party-licenses.md
    codeOutput.push( lineElementsForLibrary.join( '<br>' ) );

    if ( codeLicensesUsed.indexOf( licenseJSON[ library ].license ) < 0 ) {
      codeLicensesUsed.push( licenseJSON[ library ].license );
    }
  }

  var mediaOutput = [];
  var mediaKeys = [];
  for ( var imageAudioEntry in compositeMedia ) {
    if ( compositeMedia.hasOwnProperty( imageAudioEntry ) ) {
      mediaKeys.push( imageAudioEntry );
    }
  }
  // Use a case insensitive sort, see http://stackoverflow.com/questions/8996963/how-to-perform-case-insensitive-sorting-in-javascript
  mediaKeys.sort( function( a, b ) {
    return a.toLowerCase().localeCompare( b.toLowerCase() );
  } );

  // Create the text for the image and audio, and keep track of which licenses were used by them.
  for ( i = 0; i < mediaKeys.length; i++ ) {
    var mediaKey = mediaKeys[ i ];

    var text = compositeMedia[ mediaKey ].text.join( '<br>' ).trim();
    var projectURL = compositeMedia[ mediaKey ].projectURL.trim();

    if ( text.length === 0 ) {
      text = '(no text)';
    }

    if ( projectURL.length === 0 ) {
      projectURL = '(no project url)';
    }

    var notes = compositeMedia[ mediaKey ].notes.trim();
    if ( notes.length === 0 ) {
      notes = '(no notes)';
    }

    var license = compositeMedia[ mediaKey ].license.trim();
    assert && assert( license.length > 0, 'All media entries must have a license' );

    var mediaEntryLines = [
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
  var fileList = simTitles.join( '\n* ' );

  var outputString =
    'This report enumerates the third-party resources (code, images, audio, etc) used in a set of simulations.\n' +
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
   * Add the source (images/audio/media or code) entries to the destination object, keyed by name.
   * @param {string} repositoryName - the name of the repository, such as 'energy-skate-park-basics'
   * @param {Object} source - the object from which to read the entry
   * @param {Object} destination - the object to which to append the entry
   */
  function augment( repositoryName, source, destination ) {
    for ( let entry in source ) {
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