// Copyright 2025, University of Colorado Boulder

/**
 * Tests keyboard interaction for a simulation, outputting results to console.log.
 *
 * Usage
 * grunt test-keyboard --screens=2 --sequence="Reset All"
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

/* eslint-disable no-undef */

import playwrightLoad from '../../../../perennial-alias/js/common/playwrightLoad.js';
import getOption, { getOptionIfProvided, isOptionKeyProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import playwright from '../../../../perennial-alias/js/npm-dependencies/playwright.js';

const DEFAULT_HOST = 'http://localhost';
const DEFAULT_PORT = 80;
const DEFAULT_BRAND = 'phet-io';
const DEFAULT_QUERY_FLAGS = [ 'ea', 'debugger', 'phetioStandalone', 'logInteractiveDescriptionResponses', 'logSimLifecycle', 'audio=disabled' ] as const;
const repo = getRepo();
const defaultSim = repo !== 'chipper' ? repo : 'circuit-construction-kit-dc';
const TARGET_MESSAGE = '[SimLifecycle] Sim started';
const TAB_PRESS_COUNT = 100;
const TAB_DELAY_MS = 10;

function normalizeHost( host: string ): string {
  return host.endsWith( '/' ) ? host.slice( 0, -1 ) : host;
}

function buildTargetUrl(): string {
  const host = getOptionIfProvided<string>( 'host', DEFAULT_HOST );
  const portString = getOptionIfProvided<string>( 'port', `${DEFAULT_PORT}` );
  const port = Number( portString );
  if ( Number.isNaN( port ) || port <= 0 ) {
    throw new Error( `Invalid port "${portString}", expected a positive number.` );
  }
  const sim = getOptionIfProvided<string>( 'sim', defaultSim );
  const brand = getOptionIfProvided<string>( 'brand', DEFAULT_BRAND );
  const screens = getOption( 'screens' );

  const queryParts = [
    `brand=${encodeURIComponent( brand )}`
  ];
  screens !== undefined && queryParts.push( `screens=${encodeURIComponent( `${screens}` )}` );
  DEFAULT_QUERY_FLAGS.forEach( flag => queryParts.push( flag ) );

  const extraQuery = getOptionIfProvided<string>( 'query', '' );
  if ( extraQuery.trim().length > 0 ) {
    extraQuery.split( '&' )
      .map( part => part.trim() )
      .filter( part => part.length > 0 )
      .forEach( part => queryParts.push( part ) );
  }

  const baseHost = normalizeHost( host );
  const hostWithPort = port === 80 ? baseHost : `${baseHost}:${port}`;
  return `${hostWithPort}/${encodeURIComponent( sim )}/${encodeURIComponent( sim )}_en.html?${queryParts.join( '&' )}`;
}

export const testKeyboardInteraction = ( async () => {
  const targetUrl = buildTargetUrl();
  const sequenceProvided = isOptionKeyProvided( 'sequence' );

  const sequenceOption = sequenceProvided ?
                         getOptionIfProvided<string>( 'sequence', '' ) :
                         'Reset All';

  const accessibleNameSequence = sequenceOption.split( ';' )
    .map( name => name.trim() )
    .filter( name => name.length > 0 );

  if ( accessibleNameSequence.length === 0 ) {
    throw new Error( 'No targets provided via --sequence.' );
  }

  const tabPressCount = Number( getOptionIfProvided( 'tabPressCount', `${TAB_PRESS_COUNT}` ) );
  const tabDelay = Number( getOptionIfProvided( 'tabDelay', `${TAB_DELAY_MS}` ) );

  console.log( `[test-keyboard] Launching ${targetUrl}` );

  await playwrightLoad( targetUrl, {
    testingBrowserCreator: playwright.chromium,
    logConsoleOutput: true,
    resolveFromLoad: false,
    waitAfterLoad: 0,
    allowedTimeToLoad: 60000,
    gotoTimeout: 45000,
    onLoadTimeout: ( resolve: () => void, reject: ( error: Error ) => void ) => reject( new Error( `Timed out waiting for ${TARGET_MESSAGE}` ) ),
    onPageCreation: async ( page: playwright.Page, resolve: ( value: unknown ) => void ) => {

      let resolved = false;
      const maybeResolve = () => {
        if ( !resolved ) {
          resolved = true;
          resolve( null );
        }
      };

      type ActiveElementInfo = {
        stepNumber: number;
        tag: string;
        id: string;
        role: string;
        accessibleName: string;
        derivedAccessibleName: string;
      };

      const logActiveElement = async ( step: number ): Promise<ActiveElementInfo> => {
        return page.evaluate( ( stepNumber: number ) => {
          // @ts-expect-error
          const activeElement = document.activeElement;

          // guess the accessible name:
          const accessibleName = activeElement?.getAttribute( 'aria-label' );
          // @ts-expect-error
          const activeElementId = activeElement && 'id' in activeElement ? ( activeElement as HTMLElement ).id : '';

          // if tagName is BUTTON, then get the accessible name from the innerText
          let derivedAccessibleName = accessibleName;

          // @ts-expect-error
          if ( activeElement?.tagName === 'BUTTON' && ( activeElement as HTMLElement ).innerText ) {

            // @ts-expect-error
            derivedAccessibleName = ( activeElement as HTMLElement ).innerText;
          }
          else if ( !derivedAccessibleName && activeElementId ) {

            // @ts-expect-error
            const label = document.querySelector( `label[for="${CSS.escape( activeElementId )}"]` );
            if ( label && label.textContent ) {
              derivedAccessibleName = label.textContent;
            }
          }

          return {
            stepNumber: stepNumber,
            tag: activeElement?.tagName || '',
            id: activeElementId,
            role: activeElement?.getAttribute?.( 'role' ) || '',
            accessibleName: accessibleName || '',
            derivedAccessibleName: derivedAccessibleName || ''
          };

        }, step );
      };

      const runTabSequence = async () => {
        try {
          await page.bringToFront();
          await page.waitForTimeout( 500 );
          await page.evaluate( () => {

            // @ts-expect-error
            window.focus();

            // @ts-expect-error
            document.body && document.body.focus();
          } );

          let totalTabPresses = 0;

          for ( const targetName of accessibleNameSequence ) {
            let foundTarget = false;

            for ( let i = 0; i < tabPressCount; i++ ) {
              await page.keyboard.press( 'Tab' );
              totalTabPresses++;
              await page.waitForTimeout( tabDelay );
              const activeElementInfo = await logActiveElement( totalTabPresses );

              if ( activeElementInfo.derivedAccessibleName === targetName ) {
                console.log( `[test-keyboard] Focused "${targetName}" after ${i + 1} tab presses, pressing spacebar` );
                await page.keyboard.press( 'Space' );
                console.log( 'success' );

                await page.waitForTimeout( 250 );
                foundTarget = true;
                break;
              }
            }

            if ( !foundTarget ) {
              console.error( `[test-keyboard] Failed to focus "${targetName}" after ${tabPressCount} tab presses` );
              process.exit( 1 );
            }
          }

          maybeResolve();
        }
        catch( error ) {
          console.error( `[test-keyboard] Error during tab sequence: ${( error as Error ).message}` );
          process.exit( 1 );
        }
      };

      page.on( 'console', ( msg: playwright.ConsoleMessage ) => {
        const text = msg.text();
        if ( text.includes( TARGET_MESSAGE ) && !resolved ) {

          // eslint-disable-next-line no-void
          void runTabSequence();
        }
      } );
    },
    launchOptions: {
      headless: true
    }
  } );

  process.exit( 0 );
} )();
