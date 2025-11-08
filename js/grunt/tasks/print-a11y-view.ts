// Copyright 2025, University of Colorado Boulder

/**
 * Launches the a11y-view wrapper in Playwright so the DOM snapshot can be dumped through the page console.
 *
 * Example:
 *   grunt print-a11y-view --screens=2
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import assert from 'assert';
import playwrightLoad from '../../../../perennial-alias/js/common/playwrightLoad.js';
import getOption, { getOptionIfProvided, isOptionKeyProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import playwright from '../../../../perennial-alias/js/npm-dependencies/playwright.js';

const DEFAULT_HOST = 'http://localhost';
const DEFAULT_PATHNAME = '/chipper/wrappers/a11y-view/';
const DEFAULT_QUERY_FLAGS = [ 'phetioStandalone', 'ea', 'debugger', 'printA11yView' ] as const;

const repo = getRepo();
const defaultSim = repo !== 'chipper' ? repo : 'circuit-construction-kit-dc';

type BrowserChoice = 'chromium' | 'firefox' | 'webkit';
const BROWSER_CREATORS: Record<BrowserChoice, playwright.BrowserType<unknown>> = {
  chromium: playwright.chromium,
  firefox: playwright.firefox,
  webkit: playwright.webkit
};

function normalizeHost( host: string ): string {
  return host.endsWith( '/' ) ? host.slice( 0, -1 ) : host;
}

function normalizePath( pathname: string ): string {
  let normalized = pathname.startsWith( '/' ) ? pathname : `/${pathname}`;
  if ( !normalized.endsWith( '/' ) ) {
    normalized = `${normalized}/`;
  }
  return normalized;
}

function getBooleanOption( key: string, defaultValue: boolean ): boolean {
  if ( !isOptionKeyProvided( key ) ) {
    return defaultValue;
  }
  const value = getOption( key );
  if ( typeof value === 'boolean' ) {
    return value;
  }
  if ( typeof value === 'string' ) {
    const normalized = value.toLowerCase();
    return !( normalized === 'false' || normalized === '0' || normalized === 'no' );
  }
  return Boolean( value );
}

function buildTargetUrl(): string {
  const host = getOptionIfProvided<string>( 'host', DEFAULT_HOST );
  const pathname = getOptionIfProvided<string>( 'pathname', DEFAULT_PATHNAME );
  const sim = getOptionIfProvided<string>( 'sim', defaultSim );
  const brand = getOptionIfProvided<string>( 'brand', 'phet-io' );
  const screens = getOption<string>( 'screens' );
  const queryParts = [
    `sim=${encodeURIComponent( sim )}`,
    `brand=${encodeURIComponent( brand )}`
  ];

  screens && queryParts.push( `screens=${encodeURIComponent( `${screens}` )}` );

  DEFAULT_QUERY_FLAGS.forEach( flag => queryParts.push( flag ) );

  const extraQuery = getOption<string>( 'query' );
  if ( typeof extraQuery === 'string' && extraQuery.trim().length > 0 ) {
    extraQuery.split( '&' )
      .map( part => part.trim() )
      .filter( part => part.length > 0 )
      .forEach( part => queryParts.push( part ) );
  }

  return `${normalizeHost( host )}${normalizePath( pathname )}?${queryParts.join( '&' )}`;
}

export const printA11yViewPromise = ( async () => {

  const url = buildTargetUrl();
  console.log( `[print-a11y-view] Launching ${url}` );

  const browserOption = getOptionIfProvided<string>( 'browser', 'chromium' ).toLowerCase() as BrowserChoice;
  const browserCreator = BROWSER_CREATORS[ browserOption ];
  assert( browserCreator, `Unsupported browser "${browserOption}", expected one of ${Object.keys( BROWSER_CREATORS ).join( ', ' )}` );

  const headless = getBooleanOption( 'headless', true );
  const waitAfterLoad = Number( getOptionIfProvided( 'waitAfterLoad', 4000 ) );
  const allowedTimeToLoad = Number( getOptionIfProvided( 'allowedTimeToLoad', 45000 ) );
  const gotoTimeout = Number( getOptionIfProvided( 'gotoTimeout', 30000 ) );

  await playwrightLoad( url, {
    testingBrowserCreator: browserCreator,
    logConsoleOutput: true,
    waitAfterLoad: waitAfterLoad,
    allowedTimeToLoad: allowedTimeToLoad,
    gotoTimeout: gotoTimeout,
    launchOptions: {
      headless: headless
    }
  } );
} )();
