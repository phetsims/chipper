// Copyright 2019-2020, University of Colorado Boulder

/**
 * Launch an instance of the simulation using puppeteer, gather the phet-io api of the simulation, see phetioEngine.getPhetioElementsBaseline
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

const puppeteer = require( 'puppeteer' );

/**
 * @param {string} repo
 * @param {string} localTestingURL - the browser url to access the root of phet repos
 */
module.exports = async ( repo, localTestingURL ) => {
  localTestingURL = localTestingURL.endsWith( '/' ) ? localTestingURL : `${localTestingURL}/`;

  return new Promise( async ( resolve, reject ) => {


    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on( 'console', async msg => {

      if ( msg.text().indexOf( '"phetioFullAPI": true,' ) >= 0 ) {

        const fullAPI = msg.text();
        await browser.close();
        resolve( fullAPI );
      }

      else if ( msg.type() === 'error' ) {
        const location = msg.location ? ':\n  ' + msg.location().url : '';
        const message = msg.text() + location;
        console.error( 'Error from sim:', message );
      }
    } );

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
