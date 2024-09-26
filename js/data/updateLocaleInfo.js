// Copyright 2024, University of Colorado Boulder

/**
 * WARNING: This will commit/push the changes. Those changes likely be propagated immediately to the website and rosetta.
 *
 * NOTE: Run with CWD of chipper/js/data
 *
 * @author Matt Pennington (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const child_process = require( 'child_process' );
const fs = require( 'fs' );

/**
 * Converts locale data from babel/localeData.json into legacy formats used by rosetta and the website.
 *
 * Overall description of the localeData system:
 *
 * - babel/localeData.json - Ground truth, includes the "new" format with locale3 and englishName instead of name
 * - chipper/js/data/localeInfo.js - CommonJS legacy module
 * - chipper/js/data/localeInfo.json - JSON legacy
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

// Load our ground source of truth
const localeData = JSON.parse( fs.readFileSync( '../../../babel/localeData.json', 'utf8' ) );

// Construct the concise JS that defines the legacy locale-info format
let localeInfoSnippet = '{';
// eslint-disable-next-line phet/bad-text
const badText = 'Slave'; // There is an englishName that contains this word, see https://en.wikipedia.org/?title=Slave_language_(Athapascan)&redirect=no
// Add properties for all locales
for ( const locale of Object.keys( localeData ) ) {
  localeInfoSnippet += `
  ${locale}: {
    ${localeData[ locale ].englishName.includes( badText ) ? '// eslint-disable-next-line phet/bad-text\n    ' : ''}name: '${localeData[ locale ].englishName.replace( /'/g, '\\\'' )}',
    localizedName: '${localeData[ locale ].localizedName.replace( /'/g, '\\\'' )}',
    direction: '${localeData[ locale ].direction}'
  },`;
}
// Remove the trailing comma
localeInfoSnippet = localeInfoSnippet.slice( 0, -1 );
// Close the object
localeInfoSnippet += '\n}';

const localeInfo = {};
for ( const locale of Object.keys( localeData ) ) {
  localeInfo[ locale ] = {
    name: localeData[ locale ].englishName,
    localizedName: localeData[ locale ].localizedName,
    direction: localeData[ locale ].direction
  };
}

const newLocaleInfo = {
  _comment: 'This file is automatically generated by js/data/updateLocaleInfo.js. Do not modify it directly.',
  ...localeInfo
};

fs.writeFileSync( '../../data/localeInfo.json', JSON.stringify( newLocaleInfo, null, 2 ) );

const commonDocumentation = `// Copyright 2015-${new Date().getFullYear()}, University of Colorado Boulder

/**
  * This file is automatically generated by js/data/updateLocaleInfo.js. Do not modify it directly.
  *
  * @author automatically generated by updateLocaleInfo.js
  */

`;

const newCommonJSSouceCode = `${commonDocumentation}module.exports = ${localeInfoSnippet};`;
fs.writeFileSync( './localeInfo.js', newCommonJSSouceCode );

console.log( 'locale info files updated' );

let needsCommit = false;
try {

  // 0 exit code if there are no working copy changes from HEAD.
  child_process.execSync( 'git diff-index --quiet HEAD --' );
  console.log( 'No locale info changes, no commit needed.' );
}
catch( e ) {
  needsCommit = true;
}

if ( needsCommit ) {
  try {

    console.log( 'pulling' );

    // Some devs have rebase set by default, and you cannot rebase-pull with working copy changes.
    child_process.execSync( 'git pull --no-rebase' );

    child_process.execSync( 'git add ../../data/localeInfo.json' );
    child_process.execSync( 'git add ./localeInfo.js' );

    if ( needsCommit ) {
      console.log( 'committing' );
      child_process.execSync( 'git commit --no-verify ../../data/localeInfo.json ./localeInfo.js -m "Automatically updated generated localeInfo files"' );
      console.log( 'pushing' );
      child_process.execSync( 'git push' );
    }
  }
  catch( e ) {
    console.error( 'Unable to update files in git.', e );
  }
}