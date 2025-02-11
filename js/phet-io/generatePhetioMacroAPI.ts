// Copyright 2019-2025, University of Colorado Boulder

/**
 * Launch an instance of the simulation using puppeteer, gather the PhET-iO API of the simulation,
 * see phetioEngine.getPhetioElementsBaseline
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import assert from 'assert';
import callbackOnWorkers from '../../../perennial-alias/js/common/callbackOnWorkers.js';
import withServer from '../../../perennial-alias/js/common/withServer.js';
import _ from '../../../perennial-alias/js/npm-dependencies/lodash.js';
import puppeteer from '../../../perennial-alias/js/npm-dependencies/puppeteer.js';
import optionize from '../../../phet-core/js/optionize.js';
import { PhetioAPI } from '../../../tandem/js/phet-io-types.js';
import showCommandLineProgress from '../common/showCommandLineProgress.js';

export type PhetioAPIs = Record<string, PhetioAPI | null>; // null if errored

type GeneratePhetioMacroAPIOptions = {

  // if the built file should be used to generate the API (otherwise uses unbuilt)
  fromBuiltVersion?: boolean;

  // how many internal workers to run (how many instances of puppeteer to kick off in parallel)
  workers?: number;
  showProgressBar?: boolean;
  showMessagesFromSim?: boolean;

  // If false, allow individual repos return null if they encountered problems
  throwAPIGenerationErrors?: boolean;
};

const TIMEOUT = 120000;

type Resolved = {
  repo: string;
  api?: PhetioAPI;
  error?: Error;
};

type Browser = Awaited<ReturnType<typeof puppeteer.launch>>;

/**
 * Load each sim provided and get the
 */
const generatePhetioMacroAPI = async ( repos: string[], providedOptions?: GeneratePhetioMacroAPIOptions ): Promise<PhetioAPIs> => {

  assert( repos.length === _.uniq( repos ).length, 'repos should be unique' );

  const options = optionize<GeneratePhetioMacroAPIOptions>()( {
    fromBuiltVersion: false, // if the built file should be used to generate the API (otherwise uses unbuilt)
    workers: 4, // split into chunks with (at most) this many elements per chunk
    showProgressBar: false,
    showMessagesFromSim: true,

    // If false, allow individual repos return null if they encountered problems
    throwAPIGenerationErrors: true
  }, providedOptions );

  repos.length > 1 && console.log( 'Generating PhET-iO API for repos:', repos.join( ', ' ) );

  return withServer( async ( port: number ) => {
    const browser = await puppeteer.launch( {
      timeout: 10000000, // Don't timeout the browser when generating PhET-iO API, we handle it lower down.
      args: [
        '--disable-gpu',

        // Fork child processes directly to prevent orphaned chrome instances from lingering on sparky, https://github.com/phetsims/aqua/issues/150#issuecomment-1170140994
        '--no-zygote',
        '--no-sandbox'
      ]
    } );

    let completed = 0;
    options.showProgressBar && showCommandLineProgress( 0, false );

    const macroAPI: PhetioAPIs = {}; // if throwAPIGenerationErrors:false, a repo will be null if it encountered errors.
    const errors: Record<string, Error> = {};

    const workerResults = await callbackOnWorkers( [ ...repos ], async repo => {
      const repoResult = await loadOneSim( repo, browser, port, options.fromBuiltVersion );
      assert( repoResult.repo === repo, `unexpected repo: ${repoResult.repo}` );

      macroAPI[ repo ] = repoResult.api || null;

      const error = repoResult.error;
      if ( error ) {
        console.error( `Error in ${repo}:`, error.message );
        if ( options.throwAPIGenerationErrors ) {
          throw error;
        }
        else {
          errors[ repo ] = error;
        }
      }

      options.showProgressBar && showCommandLineProgress( ++completed / repos.length, false );
    }, {
      workers: options.workers
    } );

    options.showProgressBar && showCommandLineProgress( 1, true );

    // If any workers had problems, report them
    for ( let i = 0; i < workerResults.length; i++ ) {
      const workerResult = workerResults[ i ];
      if ( workerResult.status === 'rejected' ) {
        throw new Error( workerResult.reason );
      }
    }

    await browser.close();
    if ( Object.keys( errors ).length > 0 ) {
      console.error( 'Errors while generating PhET-iO APIs:', errors );
    }
    return macroAPI;
  } );
};

const loadOneSim = async ( repo: string, browser: Browser, port: number, fromBuiltVersion: boolean ): Promise<Resolved> => {
  const page = await browser.newPage();

  return new Promise( async resolve => { // eslint-disable-line no-async-promise-executor

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
    const cleanupAndResolve = async ( value: Resolved ) => {
      if ( await cleanup() ) {
        resolve( value );
      }
    };
    const cleanupAndReject = async ( e: Error ) => {
      if ( await cleanup() ) {
        resolve( {
          repo: repo,
          error: e
        } );
      }
    };

    // Fail if this takes too long.  Doesn't need to be cleared since only the first resolve/reject is used
    const id = setTimeout( () => cleanupAndReject( new Error( `Timeout in generatePhetioMacroAPI for ${repo}` ) ), TIMEOUT );

    page.on( 'console', async msg => {
      const messageText = msg.text();
      if ( messageText.includes( '"phetioFullAPI": true,' ) ) {
        await cleanupAndResolve( {
          // to keep track of which repo this is for
          repo: repo,

          // For machine readability, the API
          api: JSON.parse( messageText )
        } );
      }

      // // For debugging purposes
      // else if ( msg.type() === 'error' ) {
      //   console.error( messageText, msg.stackTrace() );
      // }
    } );

    page.on( 'error', cleanupAndReject );
    page.on( 'pageerror', cleanupAndReject );

    const relativePath = fromBuiltVersion ?
                         `build/phet-io/${repo}_all_phet-io.html` :
                         `${repo}_en.html`;

    // NOTE: DUPLICATION ALERT: This random seed is copied wherever API comparison is done against the generated API. Don't change this
    // without looking for other usages of this random seed value.
    const url = `http://localhost:${port}/${repo}/${relativePath}?ea&brand=phet-io&phetioStandalone&phetioPrintAPI&randomSeed=332211&webgl=false`;
    try {
      await page.goto( url, {
        timeout: TIMEOUT
      } );
    }
    catch( e ) {
      await cleanupAndReject( new Error( `page.goto failure: ${e}` ) );
    }
  } );
};

generatePhetioMacroAPI.apiVersion = '1.0.0-dev.0';

export default generatePhetioMacroAPI;