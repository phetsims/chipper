// Copyright 2019-2020, University of Colorado Boulder

/**
 * Launch an instance of the simulation using puppeteer, gather the phet-io api of the simulation, see phetioEngine.getPhetioElementsBaseline
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

const fixEOL = require( '../fixEOL' );
const fs = require( 'fs' );
const puppeteer = require( 'puppeteer' );

const writeFile = ( filePath, contents ) => fs.writeFileSync( filePath, fixEOL( contents ) );

/**
 * @param {string} repo
 * @param {string} localTestingURL - the browser url to access the root of phet repos
 */
module.exports = async ( repo, localTestingURL ) => {

  return new Promise( async ( resolve, reject ) => {

    const phetioDirectory = 'js/phet-io';
    const baselineFileName = `${phetioDirectory}/${repo}-baseline.js`;
    const overridesFileName = `${phetioDirectory}/${repo}-overrides.js`;
    const typesFileName = `${phetioDirectory}/${repo}-types.js`;

    if ( !fs.existsSync( phetioDirectory ) ) {
      fs.mkdirSync( phetioDirectory );
    }

    // empty the current baseline file so we know that a stale version is not left behind
    writeFile( baselineFileName, '/* eslint-disable */' );

    // if there is already an overrides file, don't overwrite it with an empty one
    if ( !fs.existsSync( overridesFileName ) ) {
      writeFile( overridesFileName,
        '/* eslint-disable */\nwindow.phet.preloads.phetio.phetioElementsOverrides = {};' );
    }

    let receivedBaseline = false;
    let receivedTypes = false;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on( 'console', async msg => {
      if ( msg.text().indexOf( 'window.phet.preloads.phetio.phetioElementsBaseline' ) >= 0 ) {
        writeFile( baselineFileName, msg.text() );
        receivedBaseline = true;
        await resolved();
      }

      else if ( msg.text().indexOf( 'window.phet.preloads.phetio.phetioTypes' ) >= 0 ) {
        writeFile( typesFileName, msg.text() );
        receivedTypes = true;
        await resolved();
      }
      else if ( msg.type() === 'error' ) {
        const location = msg.location ? ':\n  ' + msg.location().url : '';
        const message = msg.text() + location;
        console.error( 'Error from sim:', message );
      }
    } );

    const resolved = async () => {
      if ( receivedBaseline && receivedTypes ) {
        await browser.close();
        resolve();
      }
    };

    page.on( 'error', msg => reject( msg ) );
    page.on( 'pageerror', msg => reject( msg ) );

    try {
      await page.goto( `${localTestingURL}${repo}/${repo}_en.html?brand=phet-io&phetioStandalone&phetioPrintAPI` );
    }
    catch( e ) {
      reject( e );
    }
  } );
};
