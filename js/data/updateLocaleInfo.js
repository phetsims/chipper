// Copyright 2024, University of Colorado Boulder

/**
 * @author Matt Pennington (PhET Interactive Simulations)
 */

const child_process = require( 'child_process' );
const fs = require( 'fs' );
const localeInfo = require( './localeInfo' );

const newLocaleInfo = {
  _comment: 'This file is automatically generated by js/data/updateLocaleInfo.js. Do not modify it directly.',
  ...localeInfo
};

fs.writeFileSync( '../../data/localeInfo.json', JSON.stringify( newLocaleInfo, null, 2 ) );


let newModuleSourceCode =
`// Copyright 2015-${new Date().getFullYear()}, University of Colorado Boulder

/**
  * This file is automatically generated by js/data/updateLocaleInfo.js. Do not modify it directly.
  *
  * @author automatically generated by updateLocaleInfo.js
  */

/* eslint-env browser, node */


export default {`;


// Add properties for all locales
for ( const locale in localeInfo ) {
  newModuleSourceCode += `
  ${locale}: {
    name: '${localeInfo[ locale ].name}',
    localizedName: '${localeInfo[ locale ].localizedName}',
    direction: '${localeInfo[ locale ].direction}'
  },`;
}
// Remove the trailing comma
newModuleSourceCode = newModuleSourceCode.slice( 0, -1 );
// Close the object
newModuleSourceCode += '\n};';


fs.writeFileSync( './localeInfoModule.js', newModuleSourceCode );


try {
  child_process.execSync( 'git pull' );
  child_process.execSync( 'git add ../../data/localeInfo.json' );
  child_process.execSync( 'git add ./localeInfoModule.js' );
  child_process.execSync( 'git commit ../../data/localeInfo.json ./localeInfoModule.js -m "Automatically updated generated localeInfo files"' );
  child_process.execSync( 'git push' );
}
catch( e ) {
  console.error( 'Unable to update files in git.', e );
}