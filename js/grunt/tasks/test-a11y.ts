// Copyright 2025, University of Colorado Boulder

/**
 * Grunt task that runs an accessibility (a11y) check using axe-core/playwright.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
import AxeBuilder from '@axe-core/playwright';

import playwright from '../../../../perennial-alias/js/npm-dependencies/playwright.js';

const { chromium } = playwright;

async function runA11yCheck(): Promise<void> {
  const browser = await chromium.launch();

  // ✅ axe-core/playwright wants a page that comes from a BrowserContext
  const context = await browser.newContext();
  const page = await context.newPage();

  // Point this URL at your sim (file server, dev server, etc.)
  await page.goto( 'http://localhost/circuit-construction-kit-dc/circuit-construction-kit-dc_en.html?brand=phet-io&ea&debugger&screens=2&phetioStandalone', {
    waitUntil: 'networkidle'
  } );

  const results = await new AxeBuilder( { page: page } ).analyze();

  console.log( 'Violations:', JSON.stringify( results.violations, null, 2 ) );

  await browser.close();

  // Non-zero exit if there are violations (for CI)
  if ( results.violations.length > 0 ) {
    process.exitCode = 1;
  }
}

runA11yCheck().catch( err => {
  console.error( err );
  process.exit( 1 );
} );