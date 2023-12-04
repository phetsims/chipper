// Copyright 2002-2015, University of Colorado Boulder
/**
 * @fileoverview Rule to check that the PhET copyright statement is present and correct.
 *
 * Note it also supports PhET-iO licenses
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @copyright 2015 University of Colorado Boulder
 */

const _ = require( 'lodash' );
const path = require( 'path' );

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------


/*
The top of a private phet-io-licensed file should look like this:

// Copyright 2015-2022, University of Colorado Boulder
// This PhET-iO file requires a license
// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.
// For licensing, please contact phethelp@colorado.edu
 */
const phetioComments = [
  ' This PhET-iO file requires a license',
  ' USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.',
  ' For licensing, please contact phethelp@colorado.edu'
];

// A list of files in phet-io repos that don't need a phet-io license
const nonPhetioLicensedFiles = [
  'Gruntfile.js',
  'Gruntfile.ts',
  '.eslintrc.js',
  '-phet-io-overrides.js'
];

// Repos that get the extra check for PhET-iO licensing too.
const phetioLicenseRepos = [
  'phet-io',
  'phet-io-sim-specific',
  'phet-io-website',
  'phet-io-wrapper-classroom-activity',
  'phet-io-wrapper-haptics',
  'phet-io-wrapper-hookes-law-energy',
  'phet-io-wrapper-lab-book',
  'phet-io-wrappers',
  'studio'
].map( repo => repo + path.sep );

const gitRootPath = path.resolve( __dirname, '../../../' ) + path.sep;

// Match for a PhET-iO license if in a PhET-iO licensed repo, but not an opted out of file.
const needsPhetioLicense = filePath => {

  // Just use the path from git root, starting with something like 'chipper/'
  const localFilePath = filePath.replace( gitRootPath, '' );
  return !_.some( nonPhetioLicensedFiles, optOutFile => localFilePath.endsWith( optOutFile ) ) &&
         _.some( phetioLicenseRepos, repo => localFilePath.startsWith( repo ) );
};

module.exports = function( context ) {

  return {
    Program: function( node ) {
      // Get the whole source code, not for node only.
      const comments = context.getSourceCode().getAllComments();

      const filename = context.getFilename();
      const isHTML = filename.endsWith( '.html' );

      if ( isHTML ) {
        return;
      }

      const report = ( loc, isPhetio ) => {
        context.report( {
          node: node,
          loc: loc,
          message: `Incorrect copyright statement in first comment${isPhetio ? ', phet-io repos require phet-io licensing' : ''}`
        } );
      };

      if ( !comments || comments.length === 0 ) {
        report( 1 );
      }
      else {
        // years must be between 2000 and 2099, inclusive.  A script can be used to check that the dates
        // match the GitHub creation and last-modified dates
        const isDateRangeOK = /^ Copyright 20\d\d-20\d\d, University of Colorado Boulder$/.test( comments[ 0 ].value );
        const isSingleDateOK = /^ Copyright 20\d\d, University of Colorado Boulder$/.test( comments[ 0 ].value );
        if ( !isDateRangeOK && !isSingleDateOK ) {
          report( comments[ 0 ].loc.start );
        }

        else if ( needsPhetioLicense( filename ) ) {
          // Handle the case where PhET-iO files need more comments for licensing.

          // phet-io needs 4 line comments at the start of the file.
          if ( comments.length < 4 ) {
            report( 1, true );
          }

          const hopefulPhetioComments = comments.slice( 1, 4 );
          for ( let i = 0; i < hopefulPhetioComments.length; i++ ) {
            const comment = hopefulPhetioComments[ i ].value;
            if ( comment !== phetioComments[ i ] ) {
              report( hopefulPhetioComments[ i ].loc.start, true );
              break;
            }
          }
        }
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];