// Copyright 2020, University of Colorado Boulder

/**
 * Sorts imports for a given file
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// 3rd-party packages
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const fs = require( 'fs' );

// constants
const disallowedComments = [
  '// modules',
  '// images',
  '// strings',
  '// mipmaps'
];
const isImport = line => line.startsWith( 'import ' );

/**
 * @param {string} file
 */
module.exports = function( file ) {
  let contents = fs.readFileSync( file, 'utf-8' );
  let lines = contents.split( /\r?\n/ );

  // remove the grouping comments
  lines = lines.filter( ( line, i ) => {
    return !disallowedComments.includes( line ) || !lines[ i + 1 ] || !isImport( lines[ i + 1 ] );
  } );

  // pull out and sort imports
  const firstImportIndex = _.findIndex( lines, isImport );
  const importLines = lines.filter( isImport );
  const nonImportLines = lines.filter( _.negate( isImport ) );
  lines = [
    ...nonImportLines.slice( 0, firstImportIndex ),
    ..._.sortBy( importLines, line => line.slice( line.indexOf( '\'' ) ) ), // sort after the first '
    ...nonImportLines.slice( firstImportIndex )
  ];

  // get rid of blank lines
  const lastImportIndex = _.findLastIndex( lines, isImport );
  while ( lines[ lastImportIndex + 1 ].length === 0 && lines[ lastImportIndex + 2 ].length === 0 ) {
    lines.splice( lastImportIndex + 1, 1 );
  }

  // add a blank line after imports if there was none
  if ( lines[ lastImportIndex + 1 ].length !== 0 ) {
    lines.splice( lastImportIndex + 1, 0, '' );
  }

  contents = lines.join( '\n' );
  fs.writeFileSync( file, contents, 'utf-8' );
};
