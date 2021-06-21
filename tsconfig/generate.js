// Copyright 2021, University of Colorado Boulder
const fs = require( 'fs' ); // eslint-disable-line
const activeRunnables = fs.readFileSync( '../../perennial/data/active-runnables' ).toString().trim().split( '\n' );
const allDependencies = [];
activeRunnables.forEach( activeRunnable => {
  console.log( activeRunnable );
  const packageJSON = fs.readFileSync( `../../${activeRunnable}/package.json` ).toString();
  const json = JSON.parse( packageJSON );
  console.log( json.phet.phetLibs );
  if ( json.phet.phetLibs ) {
    json.phet.phetLibs.forEach( lib => {
      if ( !allDependencies.includes( lib ) ) {
        allDependencies.push( lib );
      }
    } );
  }
} );

console.log( allDependencies );

const toVisit = [];
activeRunnables.forEach( r => {
  if ( !toVisit.includes( r ) ) {
    toVisit.push( r );
  }
} );

allDependencies.forEach( r => {
  if ( !toVisit.includes( r ) ) {
    toVisit.push( r );
  }
} );

console.log( toVisit.join( ', ' ) );

toVisit.forEach( repo => {
  console.log( repo );

  const packageJSON = fs.readFileSync( `../../${repo}/package.json` ).toString();
  const json = JSON.parse( packageJSON );
  console.log( json.phet.phetLibs );
  let references = '[{"path":"../joist"}]';
  if ( json.phet.phetLibs ) {
    references = `[${json.phet.phetLibs.concat( 'joist' ).map( lib => {
      return `{"path":"../${lib}"}`;
    } )}]`;
  }

  const template = `{
  "extends": "../../tsconfig-core.json",
  "references": ${references},
  "include": [
    "../../../${repo}/js/**/*",
    "../../../${repo}/sounds/**/*",
    "../../../${repo}/mipmaps/**/*",
    "../../../${repo}/images/**/*"
  ]
}`;
  console.log( template );

  const writeToDisk = false;
  if ( writeToDisk ) {
    try {
      fs.mkdirSync( `../../chipper/tsconfig/${repo}/` );
    }
    catch( e ) {
      //
    }
    fs.writeFileSync( `../../chipper/tsconfig/${repo}/tsconfig.json`, template );
  }
} );

const allReferences = `[${toVisit.map( lib => {
  return `{"path":"../${lib}"}`;
} )}]`;
const all = `{
  "extends": "../../tsconfig-core.json",
  "references": ${allReferences}
}`;

console.log( all );