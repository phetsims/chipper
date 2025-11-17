// Copyright 2025, University of Colorado Boulder

/**
 * Grunt task that runs an accessibility (a11y) check using axe-core/playwright.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
import AxeBuilder from '@axe-core/playwright';

import getOption, { getOptionIfProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import playwright from '../../../../perennial-alias/js/npm-dependencies/playwright.js';

const { chromium } = playwright;

const DEFAULT_HOST = 'http://localhost';
const DEFAULT_PORT = 80;
const DEFAULT_BRAND = 'phet-io';
const AXE_IMPACT_PRIORITY: AxeImpact[] = [ 'minor', 'moderate', 'serious', 'critical' ];
const DEFAULT_QUERY_FLAGS = [ 'ea', 'debugger', 'phetioStandalone' ] as const;
const FALLBACK_SIM = 'circuit-construction-kit-dc';
const DEFAULT_MIN_IMPACT: AxeImpact = 'critical';
const SUPPRESSED_VIOLATION_IDS = new Set( [ 'meta-viewport' ] );

type AxeImpact = 'minor' | 'moderate' | 'serious' | 'critical';

const repo = getRepo();
const sim = repo !== 'chipper' ? repo : FALLBACK_SIM;

function buildTargetUrl(): string {
  const port = Number( getOptionIfProvided( 'port', DEFAULT_PORT ) );
  if ( !Number.isFinite( port ) || port <= 0 ) {
    throw new Error( `Invalid port "${port}"` );
  }

  const queryParts: string[] = [
    `brand=${encodeURIComponent( DEFAULT_BRAND )}`,
    ...DEFAULT_QUERY_FLAGS
  ];

  const screensOption = getOption( 'screens' );
  const screensValue = screensOption !== undefined ? screensOption : 1;
  queryParts.push( `screens=${encodeURIComponent( `${screensValue}` )}` );

  return `${DEFAULT_HOST}:${port}/${sim}/${sim}_en.html?${queryParts.join( '&' )}`;
}

function getMinimumImpact(): AxeImpact {
  const impactOption = getOptionIfProvided<string>( 'impact', DEFAULT_MIN_IMPACT );
  const normalized = typeof impactOption === 'string' ? impactOption.toLowerCase() : DEFAULT_MIN_IMPACT;
  if ( AXE_IMPACT_PRIORITY.includes( normalized as AxeImpact ) ) {
    return normalized as AxeImpact;
  }
  console.warn( `[test-a11y] Unsupported impact "${impactOption}", defaulting to "${DEFAULT_MIN_IMPACT}"` );
  return DEFAULT_MIN_IMPACT;
}

function includeViolation( impact: unknown, minimumImpact: AxeImpact ): boolean {
  if ( typeof impact !== 'string' ) {
    return true;
  }
  const normalized = impact.toLowerCase() as AxeImpact;
  const violationIndex = AXE_IMPACT_PRIORITY.indexOf( normalized );
  if ( violationIndex === -1 ) {
    return true;
  }
  const minimumIndex = AXE_IMPACT_PRIORITY.indexOf( minimumImpact );
  return violationIndex >= minimumIndex;
}

async function runA11yCheck(): Promise<void> {
  const browser = await chromium.launch();

  // ✅ axe-core/playwright wants a page that comes from a BrowserContext
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = buildTargetUrl();
  console.log( `[test-a11y] Launching ${url}` );
  await page.goto( url, {
    waitUntil: 'networkidle'
  } );

  const minimumImpact = getMinimumImpact();
  const results = await new AxeBuilder( { page: page } ).analyze();
  const filteredViolations = results.violations.filter( violation => {
    if ( SUPPRESSED_VIOLATION_IDS.has( violation.id ) ) {
      return false;
    }
    return includeViolation( violation.impact, minimumImpact );
  } );

  console.log( 'Violations:', JSON.stringify( filteredViolations, null, 2 ) );

  await browser.close();

  // Non-zero exit if there are violations (for CI)
  if ( filteredViolations.length > 0 ) {
    process.exitCode = 1;
  }
}

runA11yCheck().catch( err => {
  console.error( err );
  process.exit( 1 );
} );
