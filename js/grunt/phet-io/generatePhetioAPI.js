// Copyright 2019-2020, University of Colorado Boulder

/**
 * Launch an instance of the simulation using puppeteer, gather the phet-io api of the simulation, see phetioEngine.getPhetioElementsBaseline
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

const http = require( 'http' );
const fs = require( 'fs' );
const puppeteer = require( 'puppeteer' );

/**
 * @param {string} repo
 * @param {boolean} [fromBuiltVersion] - if the built file should be used to generate the API (otherwise uses unbuilt)
 */
module.exports = async ( repo, fromBuiltVersion = false ) => {

  // Consider using https://github.com/cloudhead/node-static or reading https://nodejs.org/en/knowledge/HTTP/servers/how-to-serve-static-files/
  const server = http.createServer( ( req, res ) => {

    // Trim query string
    const tail = req.url.indexOf( '?' ) >= 0 ? req.url.substring( 0, req.url.indexOf( '?' ) ) : req.url;
    const path = `${process.cwd()}/..${tail}`;

    // See https://gist.github.com/aolde/8104861
    const mimeTypes = {
      html: 'text/html',
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      js: 'text/javascript',
      css: 'text/css',
      gif: 'image/gif',
      mp3: 'audio/mpeg',
      wav: 'audio/wav'
    };
    const mimeType = mimeTypes[ path.split( '.' ).pop() ] || 'text/plain';

    fs.readFile( path, function( err, data ) {
      if ( err ) {
        res.writeHead( 404 );
        res.end( JSON.stringify( err ) );
      }
      else {
        res.writeHead( 200, { 'Content-Type': mimeType } );
        res.end( data );
      }
    } );
  } );
  server.listen( 0 );

  const port = server.address().port;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  return await new Promise( ( resolve, reject ) => {

    // Fail if this takes too long.  Doesn't need to be cleared since only the first resolve/reject is used
    setTimeout( () => reject( 'Timeout in generatePhetioAPI' ), 30000 );

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

    page.on( 'error', reject );
    page.on( 'pageerror', reject );

    const relativePath = fromBuiltVersion ?
                         `build/phet-io/${repo}_all_phet-io.html` :
                         `${repo}_en.html`;
    const url = `http://localhost:${port}/${repo}/${relativePath}?brand=phet-io&phetioStandalone&phetioPrintAPI`;
    page.goto( url ).catch( reject );
  } );
};