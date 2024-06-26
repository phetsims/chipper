// Copyright 2019-2024, University of Colorado Boulder

/**
 * Launch an instance of the simulation using puppeteer, gather the PhET-iO API of the simulation,
 * see phetioEngine.getPhetioElementsBaseline
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */


const puppeteer = require( 'puppeteer' );
const _ = require( 'lodash' );
const assert = require( 'assert' );
const showCommandLineProgress = require( '../common/showCommandLineProgress' );
const withServer = require( '../../../perennial-alias/js/common/withServer' );

/**
 * Load each sim provided and get the
 * @param {string[]} repos
 * @param {Object} [options]
 * @returns {Promise.<Object.<string, Object>>} - keys are the repos, values are the APIs for each repo. If there was a problem with getting the API with throwAPIGenerationErrors:false, then it will return null for that repo.
 */
const generatePhetioMacroAPI = async ( repos, options ) => {

  assert( repos.length === _.uniq( repos ).length, 'repos should be unique' );

  options = _.assignIn( {
    fromBuiltVersion: false, // if the built file should be used to generate the API (otherwise uses unbuilt)
    chunkSize: 4, // split into chunks with (at most) this many elements per chunk
    showProgressBar: false,
    showMessagesFromSim: true,

    // If false, allow individual repos return null if they encountered problems
    throwAPIGenerationErrors: true
  }, options );

  repos.length > 1 && console.log( 'Generating PhET-iO API for repos:', repos.join( ', ' ) );

  return withServer( async port => {
    const browser = await puppeteer.launch( {
      timeout: 10000000, // Don't timeout when generating PhET-iO API.
      args: [
        '--disable-gpu',

        // Fork child processes directly to prevent orphaned chrome instances from lingering on sparky, https://github.com/phetsims/aqua/issues/150#issuecomment-1170140994
        '--no-zygote',
        '--no-sandbox'
      ]
    } );
    const chunks = _.chunk( repos, options.chunkSize );

    const macroAPI = {}; // if throwAPIGenerationErrors:false, a repo will be null if it encountered errors.
    const errors = {};

    for ( let i = 0; i < chunks.length; i++ ) {
      const chunk = chunks[ i ];
      options.showProgressBar && showCommandLineProgress( i / chunks.length, false );

      const promises = chunk.map( async repo => {
        const page = await browser.newPage();

        return new Promise( async ( resolve, reject ) => { // eslint-disable-line no-async-promise-executor

          let cleaned = false;
          // Returns whether we closed the page
          const cleanup = async () => {
            if ( cleaned ) { return false; }
            cleaned = true; // must be before the close to prevent cleaning from being done twice if errors occur from page close.

            clearTimeout( id );
            await page.close();

            return true;
          };

          // This is likely to occur in the middle of page.goto, so we need to be graceful to the fact that resolving
          // and closing the page will then cause an error in the page.goto call, see https://github.com/phetsims/perennial/issues/268#issuecomment-1382374092
          const cleanupAndResolve = async value => {
            if ( await cleanup() ) {
              resolve( value );
            }
          };
          const cleanupAndReject = async e => {
            if ( await cleanup() ) {
              resolve( {
                repo: repo,
                error: e
              } );
            }
          };

          // Fail if this takes too long.  Doesn't need to be cleared since only the first resolve/reject is used
          const id = setTimeout( () => cleanupAndReject( new Error( `Timeout in generatePhetioMacroAPI for ${repo}` ) ), 120000 );

          page.on( 'console', async msg => {
            const messageText = msg.text();

            if ( messageText.indexOf( '"phetioFullAPI": true,' ) >= 0 ) {

              const fullAPI = messageText;

              cleanupAndResolve( {
                // to keep track of which repo this is for
                repo: repo,

                // For machine readability
                api: JSON.parse( fullAPI )
              } );
            }
          } );

          page.on( 'error', cleanupAndReject );
          page.on( 'pageerror', cleanupAndReject );

          const relativePath = options.fromBuiltVersion ?
                               `build/phet-io/${repo}_all_phet-io.html` :
                               `${repo}_en.html`;

          // NOTE: DUPLICATION ALERT: This random seed is copied wherever API comparison is done against the generated API. Don't change this
          // without looking for other usages of this random seed value.
          const url = `http://localhost:${port}/${repo}/${relativePath}?ea&brand=phet-io&phetioStandalone&phetioPrintAPI&randomSeed=332211&locales=*&webgl=false`;
          try {
            await page.goto( url, {
              timeout: 120000
            } );
          }
          catch( e ) {
            await cleanupAndReject( new Error( `page.goto failure: ${e}` ) );
          }
        } );
      } );

      const chunkResults = await Promise.allSettled( promises );

      chunkResults.forEach( chunkResult => {
        const repo = chunkResult.value.repo;
        macroAPI[ repo ] = chunkResult.value.api || null;
        const error = chunkResult.value.error;
        if ( error ) {
          if ( options.throwAPIGenerationErrors ) {
            console.error( `Error in ${repo}:` );
            throw error;
          }
          else {
            errors[ repo ] = error;
          }
        }
      } );
    }

    options.showProgressBar && showCommandLineProgress( 1, true );

    await browser.close();
    if ( Object.keys( errors ).length > 0 ) {
      console.error( 'Errors while generating PhET-iO APIs:', errors );
    }
    return macroAPI;
  } );
};

// @public (read-only)
generatePhetioMacroAPI.apiVersion = '1.0.0-dev.0';

/**
 * @param {string[]} repos
 * @param {Object} [options]
 */
module.exports = generatePhetioMacroAPI;