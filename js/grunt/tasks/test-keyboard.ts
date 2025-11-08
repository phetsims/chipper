// Copyright 2025, University of Colorado Boulder

/**
 * Tests keyboard interaction for a simulation, outputting results to console.log.
 *
 * Usage
 * grunt test-keyboard --screens=2 --accessibleName="Reset All"
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

/* eslint-disable no-undef */

import playwrightLoad from '../../../../perennial-alias/js/common/playwrightLoad.js';
import playwright from '../../../../perennial-alias/js/npm-dependencies/playwright.js';

const TARGET_URL = 'http://localhost/circuit-construction-kit-dc/circuit-construction-kit-dc_en.html?brand=phet-io&screens=2&ea&debugger&phetioStandalone&logInteractiveDescriptionResponses&logSimLifecycle&audio=disabled';
const TARGET_MESSAGE = '[SimLifecycle] Sim started';
const TAB_PRESS_COUNT = 100;
const TAB_DELAY_MS = 10;
const RESET_ALL_ACCESSIBLE_NAME = 'Reset All';

export const testKeyboardInteraction = ( async () => {
  console.log( `[test-keyboard] Launching ${TARGET_URL}` );

  await playwrightLoad( TARGET_URL, {
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

          for ( let i = 0; i < TAB_PRESS_COUNT; i++ ) {
            await page.keyboard.press( 'Tab' );
            await page.waitForTimeout( TAB_DELAY_MS );
            const activeElementInfo = await logActiveElement( i + 1 );

            if ( activeElementInfo.derivedAccessibleName === RESET_ALL_ACCESSIBLE_NAME ) {
              console.log( `[test-a11y-view] Focused "${RESET_ALL_ACCESSIBLE_NAME}" after ${i + 1} tab presses, pressing spacebar` );
              await page.keyboard.press( 'Space' );
              console.log( 'success' );

              await page.waitForTimeout( 250 );
              maybeResolve();
              return;
            }
          }

          console.error( `[test-a11y-view] Failed to focus "${RESET_ALL_ACCESSIBLE_NAME}" after ${TAB_PRESS_COUNT} tab presses` );
          process.exit( 1 );
        }
        catch( error ) {
          console.error( `[test-a11y-view] Error during tab sequence: ${( error as Error ).message}` );
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
