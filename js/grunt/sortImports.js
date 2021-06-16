[object Promise]

/**
 * Sorts imports for a given file.
 *
 * This follows the Intellij/Webstorm defaults, where we do NOT sort based on the eventual name, but instead only based
 * on the import path (e.g. everything after the `from` in the import).
 *
 * This will attempt to group all of the imports in one block.
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
 * @param {boolean} verifyOnly - Don't rewrite file, just verify already sorted
 * @returns {boolean} - Was the file properly sorted to begin with?
 */
module.exports = function( file, verifyOnly = false ) {
  const before = fs.readFileSync( file, 'utf-8' );
  let lines = before.split( /\r?\n/ );

  // remove the grouping comments
  lines = lines.filter( ( line, i ) => {
    const nextLine = lines[ i + 1 ];
    return !disallowedComments.includes( line ) || !nextLine || !isImport( nextLine );
  } );

  // pull out and sort imports
  let firstImportIndex = _.findIndex( lines, isImport );
  const importLines = lines.filter( isImport );
  const nonImportLines = lines.filter( _.negate( isImport ) );
  lines = [
    ...nonImportLines.slice( 0, firstImportIndex ),
    ..._.sortBy( importLines, line => line.slice( line.indexOf( '\'' ) ).toLowerCase() ), // sort after the first '
    ...nonImportLines.slice( firstImportIndex )
  ];

  // get rid of blank lines
  const lastImportIndex = _.findLastIndex( lines, isImport );
  const afterLastImportIndex = lastImportIndex + 1;
  while ( lines[ afterLastImportIndex ].length === 0 && lines[ lastImportIndex + 2 ].length === 0 ) {
    lines.splice( afterLastImportIndex, 1 );
  }

  // add a blank line after imports if there was none
  if ( lines[ afterLastImportIndex ].length !== 0 ) {
    lines.splice( afterLastImportIndex, 0, '' );
  }

  // remove multiple blank lines above the imports
  while ( lines[ firstImportIndex - 1 ] === '' && lines[ firstImportIndex - 2 ] === '' ) {
    lines.splice( firstImportIndex - 1, 1 );
    firstImportIndex--;
  }

  const after = lines.join( '\n' );
  if ( !verifyOnly ) {
    fs.writeFileSync( file, after, 'utf-8' );
  }
  return ( after === before );
};
