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

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on( 'console', async function( msg ) {

      if ( msg.text().indexOf( 'window.phet.phetio.phetioElementsBaseline' ) >= 0 ) {
        fs.writeFileSync( `js/phet-io/${repo}-phet-io-elements-baseline.js`, msg.text() );
        await browser.close();
        resolve();
      }
    } );

    page.on( 'error', msg => reject( msg ) );
    page.on( 'pageerror', msg => reject( msg ) );

    try {
      await page.goto( `${localTestingURL}${repo}/${repo}_en.html?brand=phet-io&phetioStandalone&ea&phetioPrintPhetioElementsBaseline&phetioExperimental` );
    }
    catch( e ) {
      reject( e );
    }
  } );
};
