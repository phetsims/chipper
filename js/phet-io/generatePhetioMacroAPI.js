[object Promise]

/**
 * Launch an instance of the simulation using puppeteer, gather the PhET-iO API of the simulation,
 * see phetioEngine.getPhetioElementsBaseline
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

const http = require( 'http' );
const fs = require( 'fs' );
const puppeteer = require( 'puppeteer' );
const _ = require( 'lodash' ); // eslint-disable-line
const assert = require( 'assert' );

/**
 * Load each sim provided and get the
 * @param {string[]} repos
 * @param {Object} [options]
 * @returns {Promise<Object.<string, Object>>} - keys are the repos, values are the APIs for each repo.
 */
const generatePhetioMacroAPI = async ( repos, options ) => {

  assert( repos.length === _.uniq( repos ).length, 'repos should be unique' );

  options = _.extend( { // eslint-disable-line
    fromBuiltVersion: false, // if the built file should be used to generate the API (otherwise uses unbuilt)
    chunkSize: 4, // split into chunks with (at most) this many elements per chunk
    showProgressBar: false,
    showMessagesFromSim: true
  }, options );

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

    fs.readFile( path, ( err, data ) => {
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
  const chunks = _.chunk( repos, options.chunkSize );

  const macroAPI = {};

  // See https://jagascript.com/how-to-build-a-textual-progress-bar-for-cli-and-terminal-apps/
  const showProgress = ( progress, newline = false ) => {
    const progressBarLength = 40;
    const dots = '.'.repeat( Math.round( progress * progressBarLength ) ); // eslint-disable-line
    const empty = ' '.repeat( Math.round( ( 1 - progress ) * progressBarLength ) ); // eslint-disable-line
    const newlineString = newline ? '\n' : '';
    process.stdout.write( `\r[${dots}${empty}] ${( progress * 100 ).toFixed( 2 )}%${newlineString}` );
  };

  for ( let i = 0; i < chunks.length; i++ ) {
    const chunk = chunks[ i ];
    options.showProgressBar && showProgress( i / chunks.length );

    const promises = chunk.map( async repo => {
      const page = await browser.newPage();

      return new Promise( async ( resolve, reject ) => { // eslint-disable-line no-async-promise-executor

        // Fail if this takes too long.  Doesn't need to be cleared since only the first resolve/reject is used
        setTimeout( () => reject( new Error( 'Timeout in generatePhetioMacroAPI' ) ), 30000 );

        let cleaned = false;
        const cleanup = async () => {
          if ( cleaned ) { return; }
          cleaned = true;

          await page.close();
        };
        const cleanupAndReject = async e => {
          await cleanup();
          reject( e );
        };

        page.on( 'console', async msg => {
          const messageText = msg.text();

          if ( messageText.indexOf( '"phetioFullAPI": true,' ) >= 0 ) {

            const fullAPI = messageText;

            resolve( {

              // to keep track of which repo this is for
              repo: repo,

              // For machine readability
              api: JSON.parse( fullAPI )
            } );
            await cleanup();
          }

          else if ( msg.type() === 'error' ) {
            const location = msg.location ? `:\n  ${msg.location().url}` : '';
            const message = messageText + location;
            console.error( 'Error from sim:', message );
          }

          else {
            const text = messageText;
            const list = [
              'The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page. https://goo.gl/7K7WLu',
              'enabling assert'
            ];
            if ( !list.includes( text.trim() ) ) {
              options.showMessagesFromSim && console.log( 'Message from sim:', text );
            }
          }
        } );

        page.on( 'error', cleanupAndReject );
        page.on( 'pageerror', cleanupAndReject );

        const relativePath = options.fromBuiltVersion ?
                             `build/phet-io/${repo}_all_phet-io.html` :
                             `${repo}_en.html`;
        const url = `http://localhost:${port}/${repo}/${relativePath}?ea&brand=phet-io&phetioStandalone&phetioPrintAPI&randomSeed=12345`;
        try {
          await page.goto( url );
        }
        catch( e ) {
          await cleanupAndReject( e );
        }
      } );
    } );

    const chunkResults = await Promise.allSettled( promises );

    chunkResults.forEach( chunkResult => {
      if ( chunkResult.status === 'fulfilled' ) {
        assert( chunkResult.value.api instanceof Object, 'api expected from Promise results' );
        macroAPI[ chunkResult.value.repo ] = chunkResult.value.api;
      }
      else {
        console.error( 'Error in fulfilling chunk Promise:', chunkResult.reason );
      }
    } );
  }

  options.showProgressBar && showProgress( 1, true );

  await browser.close();
  server.close();
  server.unref();
  return macroAPI;
};

// @public (read-only)
generatePhetioMacroAPI.apiVersion = '1.0.0-dev.0';

/**
 * @param {string[]} repos
 * @param {Object} [options]
 */
module.exports = generatePhetioMacroAPI;