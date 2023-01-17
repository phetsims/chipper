// Copyright 2019, University of Colorado Boulder

/**
 * Launch an instance of the simulation using puppeteer, gather the phet-io api of the simulation, see phetioEngine.getPhetioElementsBaseline
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

const puppeteer = require( 'puppeteer' );
const fs = require( 'fs' );

/**
 * @param {string} repo
 * @param {string} localTestingURL - the browser url to access the root of phet repos
 */
module.exports = async ( repo, localTestingURL ) => {

  return new Promise( async ( resolve, reject ) => {

    const phetioDirectory = 'js/phet-io';
    const baselineFileName = `${phetioDirectory}/${repo}-phet-io-elements-baseline.js`;
    const overridesFileName = `${phetioDirectory}/${repo}-phet-io-elements-overrides.js`;
    const typesFileName = `${phetioDirectory}/${repo}-phet-io-types.js`;

    if ( !fs.existsSync( phetioDirectory ) ) {
      fs.mkdirSync( phetioDirectory );
    }

    // empty the current baseline file so we know that a stale version is not left behind
    fs.writeFileSync( baselineFileName, '' );

    // if there is already an overrides file, don't overwrite it with an empty one
    if ( !fs.existsSync( overridesFileName ) ) {
      fs.writeFileSync( overridesFileName,
        '/* eslint-disable */\nwindow.phet.phetio.phetioElementsOverrides = {};' );
    }

    let receivedBaseline = false;
    let receivedTypes = false;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let cleaned = false;

    page.on( 'console', async msg => {
      if ( msg.text().indexOf( 'window.phet.phetio.phetioElementsBaseline' ) >= 0 ) {
        fs.writeFileSync( baselineFileName, msg.text() );
        receivedBaseline = true;
        await resolved();
      }

      if ( msg.text().indexOf( 'window.phet.phetio.phetioTypes' ) >= 0 ) {
        fs.writeFileSync( typesFileName, msg.text() );
        receivedTypes = true;
        await resolved();
      }
    } );

    const resolved = async () => {
      if ( receivedBaseline && receivedTypes && !cleaned ) {
        cleaned = true;

        await page.close();
        await browser.close();
        resolve();
      }
    };

    page.on( 'error', msg => reject( msg ) );
    page.on( 'pageerror', msg => reject( msg ) );

    try {
      await page.goto( `${localTestingURL}${repo}/${repo}_en.html?brand=phet-io&phetioStandalone&ea&phetioPrintPhetioFiles` );
    }
    catch( e ) {
      if ( !cleaned ) {
        reject( e );
      }
    }
  } );
};
