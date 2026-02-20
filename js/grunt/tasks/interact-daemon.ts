// Copyright 2025-2026, University of Colorado Boulder

/* eslint-disable */
// @ts-nocheck

/**
 * Persistent keyboard interaction daemon for PhET simulations.
 *
 * This daemon launches a browser with a PhET simulation and provides an HTTP API
 * for programmatic keyboard navigation and interaction. It's designed for:
 * - Automated accessibility testing
 * - AI-assisted simulation interaction (e.g., Claude Code)
 * - Manual testing workflows
 * - CI/CD accessibility checks
 *
 * ## Starting the Daemon
 *
 * ```bash
 * cd your-sim-repo
 * grunt interact-daemon --screens=2
 * ```
 *
 * This will:
 * 1. Launch the simulation in a visible browser window
 * 2. Wait for the sim to fully load
 * 3. Start an HTTP server on port 3001 (configurable)
 * 4. Accept commands and return JSON responses
 * 5. Keep running until you Ctrl+C
 *
 * ## Available Endpoints
 *
 * ### GET /status
 * Returns daemon status and current focus
 * ```bash
 * curl -s http://localhost:3001/status | jq
 * ```
 * Response:
 * ```json
 * {
 *   "ready": true,
 *   "url": "http://localhost/sim/sim_en.html?...",
 *   "focus": { "name": "Wire", "role": "application" }
 * }
 * ```
 *
 * ### POST /cmd
 * Execute one or more commands
 * ```bash
 * curl -s -X POST http://localhost:3001/cmd \
 *   -H "Content-Type: application/json" \
 *   -d '{"commands": [{"tab": 5}, {"find": "Values", "press": "Space"}]}' | jq
 * ```
 *
 * ### POST /reload
 * Reload the simulation page (useful when things go wrong)
 * ```bash
 * curl -s -X POST http://localhost:3001/reload | jq
 * ```
 *
 * **Note:** Always use `-s` (silent) flag with curl to suppress the progress meter,
 * which saves tokens and reduces output noise.
 *
 * ## Command API
 *
 * Commands are sent as a JSON array. Each command is executed sequentially,
 * and focus info is returned after each command.
 *
 * ### Tab Navigation
 *
 * Tab forward (default: 1 time):
 * ```json
 * { "tab": 5 }
 * ```
 *
 * Tab backward:
 * ```json
 * { "shiftTab": 3 }
 * ```
 *
 * ### Finding and Activating Elements
 *
 * Find an element by accessible name and activate it:
 * ```json
 * { "find": "Reset All" }
 * ```
 * This tabs until "Reset All" is focused, then presses Space (default).
 *
 * Find and press a specific key:
 * ```json
 * { "find": "Submit Button", "press": "Enter" }
 * ```
 *
 * ### Pressing Keys
 *
 * Press a key on the currently focused element (no tabbing):
 * ```json
 * { "press": "Space" }
 * { "press": "Enter" }
 * { "press": "ArrowDown" }
 * ```
 *
 * ### Querying State
 *
 * Get current focus (though focus is returned after every command anyway):
 * ```json
 * { "getFocus": true }
 * ```
 *
 * Look at the current simulation state (PDOM tree + focus order):
 * ```json
 * { "look": true }
 * ```
 * Returns the entire accessible DOM as text with the focused element marked,
 * plus the full tab order showing all focusable elements with current focus indicated.
 *
 * ### Timing
 *
 * Wait for a duration:
 * ```json
 * { "wait": 500 }
 * ```
 * Milliseconds. Useful for waiting for animations or async updates.
 *
 * ### Navigation
 *
 * Navigate to a different simulation or URL:
 * ```json
 * { "navigate": "http://localhost/number-pairs/number-pairs_en.html?brand=phet-io&ea&debugger&screens=5&phetioStandalone" }
 * ```
 * Loads the new URL and waits for the sim to be ready (up to 30 seconds).
 * The current page state is replaced. Use this to switch between different sims or screens.
 *
 * ## Complete Examples
 *
 * Basic interaction sequence:
 * ```bash
 * curl -s -X POST http://localhost:3001/cmd \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "commands": [
 *       { "tab": 10 },
 *       { "find": "Show Current", "press": "Space" },
 *       { "wait": 100 },
 *       { "find": "Values", "press": "Space" },
 *       { "getFocus": true }
 *     ]
 *   }' | jq
 * ```
 *
 * Navigate to a different sim:
 * ```bash
 * curl -s -X POST http://localhost:3001/cmd \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "commands": [
 *       { "navigate": "http://localhost/number-pairs/number-pairs_en.html?brand=phet-io&ea&debugger&screens=5&phetioStandalone&logSimLifecycle" },
 *       { "tab": 5 },
 *       { "find": "Reset All" }
 *     ]
 *   }' | jq
 * ```
 *
 * ## Response Format
 *
 * Each command returns a result object:
 * ```json
 * {
 *   "success": true,
 *   "command": { "tab": 5 },
 *   "action": "Tabbed 5 time(s)",
 *   "focus": {
 *     "name": "Light Bulb",
 *     "role": "application"
 *   }
 * }
 * ```
 *
 * For checkboxes and inputs, additional fields appear:
 * ```json
 * {
 *   "focus": {
 *     "name": "Values",
 *     "role": "checkbox",
 *     "checked": true
 *   }
 * }
 * ```
 *
 * When ARIA live region announcements occur, they are captured:
 * ```json
 * {
 *   "success": true,
 *   "command": { "press": "ArrowDown" },
 *   "action": "Pressed ArrowDown",
 *   "focus": { "name": "Conventional", "role": "" },
 *   "ariaLive": [
 *     "Conventional current selected"
 *   ]
 * }
 * ```
 *
 * If a command fails:
 * ```json
 * {
 *   "success": false,
 *   "command": { "find": "Nonexistent" },
 *   "action": "Failed to find \"Nonexistent\" after 100 tabs",
 *   "focus": { "name": "Reset All", "role": "button" },
 *   "error": "Target \"Nonexistent\" not found"
 * }
 * ```
 *
 * ## Options
 *
 * ### Grunt Options
 * - `--screens=2` - Which screen(s) to load (default: all)
 * - `--sim=my-sim` - Simulation name (default: repo name)
 * - `--brand=phet-io` - Brand (default: phet-io)
 * - `--daemonPort=3001` - HTTP server port (default: 3001)
 * - `--port=80` - Sim web server port (default: 80)
 * - `--host=http://localhost` - Sim web server host (default: http://localhost)
 * - `--tabDelay=10` - Milliseconds between tab presses (default: 10)
 * - `--tabPressCount=100` - Max tabs when finding elements (default: 100)
 * - `--query=foo=bar&baz=qux` - Additional query parameters
 *
 * ### Request Options
 * Add to the POST body:
 * ```json
 * {
 *   "commands": [...],
 *   "continueOnError": true
 * }
 * ```
 * By default, command execution stops on the first error. Set `continueOnError: true`
 * to execute all commands regardless of errors.
 *
 * ## Design Philosophy
 *
 * This tool is designed to be:
 * - **Efficient**: Returns minimal JSON (~50-200 tokens per command) instead of full page snapshots
 * - **Composable**: Commands can be chained together for complex workflows
 * - **Debuggable**: Same curl commands work manually and in scripts
 * - **Stateful**: Browser stays alive between commands, maintaining simulation state
 * - **Simple**: One daemon per sim, straightforward HTTP API
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

/* eslint-disable no-undef */

import http from 'http';
import playwrightLoad from '../../../../perennial-alias/js/common/playwrightLoad.js';
import getOption, { getOptionIfProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import playwright from '../../../../perennial-alias/js/npm-dependencies/playwright.js';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';

const DEFAULT_HOST = 'http://localhost';
const DEFAULT_PORT = 80;
const DEFAULT_DAEMON_PORT = 3001;
const DEFAULT_BRAND = 'phet-io';
const DEFAULT_QUERY_FLAGS = [ 'ea', 'debugger', 'phetioStandalone', 'logInteractiveDescriptionResponses', 'logSimLifecycle', 'audio=disabled' ] as const;
const repo = getRepo();
const defaultSim = repo !== 'chipper' ? repo : 'circuit-construction-kit-dc';
const TARGET_MESSAGE = '[SimLifecycle] Sim started';
const TAB_PRESS_COUNT = 100;
const TAB_DELAY_MS = 10;
const ARIA_LIVE_WAIT_TIMEOUT_MS = 500;

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

/**
 * Information about the currently focused element.
 * Returned after every command execution.
 */
type FocusInfo = {
  /** The accessible name of the focused element (aria-label, button text, etc.) */
  name: string;

  /** The ARIA role (e.g., "button", "checkbox", "application") */
  role: string;

  /** For checkboxes: whether it's checked */
  checked?: boolean;

  /** For inputs: the current value */
  value?: string;
};

/**
 * Result returned after executing a single command.
 */
type CommandResult = {
  /** Whether the command succeeded */
  success: boolean;

  /** The command that was executed */
  command: Command;

  /** Human-readable description of what happened */
  action?: string;

  /** Focus info after command execution */
  focus: FocusInfo;

  /** ARIA live region announcements captured after command execution */
  ariaLive?: string[];

  /** Full PDOM tree with focused element marked (only present for look commands) */
  pdom?: string;

  /** Full PDOM HTML (only present for peekHtml commands) */
  pdomHtml?: string;

  /** Tab order showing all focusable elements with current focus marked (only present for look commands) */
  focusOrder?: string[];

  /** Error message if command failed */
  error?: string;

  /** Page errors that occurred since last command */
  pageErrors?: string[];
};

/**
 * A command to execute in the simulation.
 * Commands are plain objects with one primary property indicating the command type.
 */
type Command =
  | { tab: number }
  | { shiftTab: number }
  | { press: string }
  | { find: string; press?: string; pressAfter?: boolean }
  | { look: true }
  | { peek: true }
  | { peekHtml: true }
  | { getFocus: true }
  | { wait: number }
  | { navigate: string }
  | { screenshot: string };

/**
 * Wait for and capture ARIA live region announcements.
 * Returns all ARIA-LIVE messages captured within the timeout period.
 */
function waitForAriaLiveMessages( page: playwright.Page, timeoutMs: number ): Promise<string[]> {
  return new Promise( resolve => {
    const ariaLiveMessages: string[] = [];
    let timeoutId: NodeJS.Timeout;

    const handleConsole = ( msg: playwright.ConsoleMessage ) => {
      const text = msg.text();
      if ( text.includes( '[ARIA-LIVE]' ) ) {
        // Extract just the message content, removing the [ARIA-LIVE] prefix
        const message = text.replace( /^\[ARIA-LIVE\]\s*/, '' );
        ariaLiveMessages.push( message );
      }
    };

    const cleanup = () => {
      clearTimeout( timeoutId );
      page.off( 'console', handleConsole );
      resolve( ariaLiveMessages );
    };

    page.on( 'console', handleConsole );
    timeoutId = setTimeout( cleanup, timeoutMs );
  } );
}

/**
 * Create a handle to the currently focused element and a function to restore focus to it.
 * Returns both the handle (which must be disposed) and the restore function.
 */
async function createFocusRestoration( page: playwright.Page ): Promise<{
  handle: playwright.JSHandle;
  restore: () => Promise<boolean>;
}> {
  // @ts-expect-error
  const handle = await page.evaluateHandle( () => document.activeElement );

  const restore = async (): Promise<boolean> => {
    const element = handle.asElement?.();
    if ( element ) {
      return element.evaluate( ( el: IntentionalAny ) => {
        // @ts-expect-error
        if ( el && 'focus' in el && typeof ( el as HTMLElement ).focus === 'function' ) {
          // @ts-expect-error
          ( el as HTMLElement ).focus();
          return true;
        }
        return false;
      } );
    }
    return false;
  };

  return { handle: handle, restore: restore };
}

/**
 * Get the tab order - all focusable elements with current focus indicated.
 * Tabs through the actual focus loop to discover the real tab order.
 * Returns an array of element names in tab order.
 */
async function getFocusOrder( page: playwright.Page ): Promise<string[]> {
  const tabDelay = Number( getOptionIfProvided( 'tabDelay', `${TAB_DELAY_MS}` ) );
  const maxTabs = Number( getOptionIfProvided( 'tabPressCount', `${TAB_PRESS_COUNT}` ) );

  const { handle: originalFocusHandle, restore: restoreOriginalFocus } = await createFocusRestoration( page );
  const originalFocus = await getFocusInfo( page, true );
  console.log( `starting at ${originalFocus.dataUniqueId} ${originalFocus.name}` );

  const visitedUniqueIDs: string[] = [ originalFocus.dataUniqueId ];
  const focusOrder: string[] = [ originalFocus.name ];

  await page.keyboard.press( 'Tab' );
  await page.waitForTimeout( tabDelay );

  try {
    // Tab through and collect all focusable elements
    for ( let i = 0; i < maxTabs; i++ ) {
      const currentFocus = await getFocusInfo( page, true );
      console.log( `visit at ${currentFocus.dataUniqueId} ${currentFocus.name}` );

      // Check if we've looped back to the start (but allow first iteration)
      if ( visitedUniqueIDs.includes( currentFocus.dataUniqueId ) ) {
        break;
      }

      // Somehow the entire document shows up as the accessible name of an item,
      // filter it out (same logic as in find command)
      if ( currentFocus.name.length < 100 ) {
        focusOrder.push( currentFocus.name );
        console.log( `  added ${currentFocus.name}` );
      }
      visitedUniqueIDs.push( currentFocus.dataUniqueId );

      await page.keyboard.press( 'Tab' );
      await page.waitForTimeout( tabDelay );
    }

    // Restore original focus
    await restoreOriginalFocus();

    return focusOrder;
  }
  finally {
    await originalFocusHandle.dispose();
  }
}

/**
 * Get information about the currently focused element.
 */
async function getFocusInfo( page: playwright.Page, withID = false ): Promise<FocusInfo> {
  const result = page.evaluate( () => {
    // @ts-expect-error
    const activeElement = document.activeElement;

    // @ts-expect-error
    const activeElementId = activeElement && 'id' in activeElement ? ( activeElement as HTMLElement ).id : '';
    const accessibleName = activeElement?.getAttribute?.( 'aria-label' );
    const dataUniqueId = activeElement?.getAttribute?.( 'data-unique-id' );

    let derivedAccessibleName = accessibleName;

    const innerText = activeElement?.innerText || '';

    if ( !derivedAccessibleName && activeElement?.tagName === 'BUTTON' && innerText ) {
      derivedAccessibleName = innerText;
    }
    else if ( !derivedAccessibleName && activeElementId ) {
      // @ts-expect-error
      const label = document.querySelector( `label[for="${CSS.escape( activeElementId )}"]` );
      if ( label && label.textContent ) {
        derivedAccessibleName = label.textContent;
      }
    }

    // Pick the best name available
    const name = derivedAccessibleName || innerText || activeElement?.tagName || 'unknown';

    const checked = activeElement?.type === 'checkbox' ? activeElement.checked : undefined;
    const value = 'value' in activeElement && activeElement.value ? activeElement.value : undefined;

    return {
      name: name,
      role: activeElement?.getAttribute?.( 'role' ) || '',
      checked: checked,
      value: value,
      dataUniqueId: dataUniqueId || '',
      id: activeElementId || ''

    };
  } );

  if ( !withID ) {
    delete result.id;
    delete result.dataUniqueId;
  }

  return result;
}

/**
 * Execute a single command in the simulation.
 */
async function executeCommand( page: playwright.Page, cmd: Command, simReadyRef: { current: boolean }, pageErrorsRef: { current: string[] } ): Promise<CommandResult> {
  const tabDelay = Number( getOptionIfProvided( 'tabDelay', `${TAB_DELAY_MS}` ) );

  try {
    // Tab forward
    if ( 'tab' in cmd ) {
      const count = cmd.tab;
      const ariaLivePromise = waitForAriaLiveMessages( page, ARIA_LIVE_WAIT_TIMEOUT_MS );
      for ( let i = 0; i < count; i++ ) {
        await page.keyboard.press( 'Tab' );
        await page.waitForTimeout( tabDelay );
      }
      const ariaLive = await ariaLivePromise;
      return {
        success: true,
        command: cmd,
        action: `Tabbed ${count} time(s)`,
        focus: await getFocusInfo( page ),
        ariaLive: ariaLive.length > 0 ? ariaLive : undefined
      };
    }

    // Tab backward
    if ( 'shiftTab' in cmd ) {
      const count = cmd.shiftTab;
      const ariaLivePromise = waitForAriaLiveMessages( page, ARIA_LIVE_WAIT_TIMEOUT_MS );
      for ( let i = 0; i < count; i++ ) {
        await page.keyboard.press( 'Shift+Tab' );
        await page.waitForTimeout( tabDelay );
      }
      const ariaLive = await ariaLivePromise;
      return {
        success: true,
        command: cmd,
        action: `Shift+Tabbed ${count} time(s)`,
        focus: await getFocusInfo( page ),
        ariaLive: ariaLive.length > 0 ? ariaLive : undefined
      };
    }

    // Press a key
    if ( 'press' in cmd ) {
      const key = cmd.press;
      const ariaLivePromise = waitForAriaLiveMessages( page, ARIA_LIVE_WAIT_TIMEOUT_MS );
      // @ts-expect-error
      await page.keyboard.press( key );
      await page.waitForTimeout( tabDelay );
      const ariaLive = await ariaLivePromise;
      return {
        success: true,
        command: cmd,
        action: `Pressed ${key}`,
        focus: await getFocusInfo( page ),
        ariaLive: ariaLive.length > 0 ? ariaLive : undefined
      };
    }

    // Wait
    if ( 'wait' in cmd ) {
      const ms = cmd.wait;
      await page.waitForTimeout( ms );
      return {
        success: true,
        command: cmd,
        action: `Waited ${ms}ms`,
        focus: await getFocusInfo( page )
      };
    }

    // Look at current state (PDOM + focus loop)
    if ( 'look' in cmd ) {
      const pdom = await page.evaluate( () => {
        // @ts-expect-error
        const pdomRoot = ( window.phet as IntentionalAny )?.joist?.sim?.display?.pdomRootElement;
        if ( !pdomRoot ) {
          return 'PDOM not available';
        }

        // @ts-expect-error
        const focusedElement = document.activeElement;
        const lines = pdomRoot.innerText.split( '\n' );

        // Try to mark the focused element in the text
        // @ts-expect-error
        if ( focusedElement && focusedElement !== document.body ) {
          const ariaLabel = focusedElement.getAttribute?.( 'aria-label' );
          const innerText = focusedElement.innerText || '';
          const focusedName = ariaLabel || innerText || focusedElement.tagName;

          // Find and mark the line containing the focused element
          return lines.map( ( line: string ) => {
            const trimmedLine = line.trim();
            if ( trimmedLine && focusedName && trimmedLine.includes( focusedName ) ) {
              return `>>> ${line} <<<`;
            }
            return line;
          } ).join( '\n' );
        }

        return pdomRoot.innerText;
      } );

      const focusOrder = await getFocusOrder( page );

      return {
        success: true,
        command: cmd,
        action: 'Looked at current state',
        focus: await getFocusInfo( page ),
        pdom: pdom,
        focusOrder: focusOrder
      };
    }

    // Peek at PDOM without disrupting focus
    if ( 'peek' in cmd ) {
      const pdom = await page.evaluate( () => {
        // @ts-expect-error
        const pdomRoot = ( window.phet as IntentionalAny )?.joist?.sim?.display?.pdomRootElement;
        if ( !pdomRoot ) {
          return 'PDOM not available';
        }

        // @ts-expect-error
        const focusedElement = document.activeElement;
        const lines = pdomRoot.innerText.split( '\n' );

        // Try to mark the focused element in the text
        // @ts-expect-error
        if ( focusedElement && focusedElement !== document.body ) {
          const ariaLabel = focusedElement.getAttribute?.( 'aria-label' );
          const innerText = focusedElement.innerText || '';
          const focusedName = ariaLabel || innerText || focusedElement.tagName;

          // Find and mark the line containing the focused element
          return lines.map( ( line: string ) => {
            const trimmedLine = line.trim();
            if ( trimmedLine && focusedName && trimmedLine.includes( focusedName ) ) {
              return `>>> ${line} <<<`;
            }
            return line;
          } ).join( '\n' );
        }

        return pdomRoot.innerText;
      } );

      return {
        success: true,
        command: cmd,
        action: 'Peeked at PDOM (no focus disruption)',
        focus: await getFocusInfo( page ),
        pdom: pdom
      };
    }

    // Peek at full PDOM HTML without disrupting focus
    if ( 'peekHtml' in cmd ) {
      const pdomHtml = await page.evaluate( () => {
        // @ts-expect-error
        const pdomRoot = ( window.phet as IntentionalAny )?.joist?.sim?.display?.pdomRootElement;
        if ( !pdomRoot ) {
          return 'PDOM not available';
        }

        return pdomRoot.outerHTML;
      } );

      return {
        success: true,
        command: cmd,
        action: 'Peeked at PDOM HTML (no focus disruption)',
        focus: await getFocusInfo( page ),
        pdomHtml: pdomHtml
      };
    }

    // Get focus
    if ( 'getFocus' in cmd ) {
      return {
        success: true,
        command: cmd,
        action: 'Retrieved focus',
        focus: await getFocusInfo( page )
      };
    }

    // Find element and optionally press key
    if ( 'find' in cmd ) {
      const targetName = cmd.find;
      const pressAfter = cmd.pressAfter !== false; // Default to true
      const pressKey = cmd.press || 'Space';
      const maxTabs = Number( getOptionIfProvided( 'tabPressCount', `${TAB_PRESS_COUNT}` ) );

      const availableFocus: string[] = [];

      const { handle: originalFocusHandle, restore: restoreOriginalFocus } = await createFocusRestoration( page );

      try {
        for ( let i = 0; i < maxTabs; i++ ) {
          await page.keyboard.press( 'Tab' );
          await page.waitForTimeout( tabDelay );
          const focus = await getFocusInfo( page );
          availableFocus.push( focus.name );

          if ( focus.name === targetName ) {
            if ( pressAfter ) {
              const ariaLivePromise = waitForAriaLiveMessages( page, ARIA_LIVE_WAIT_TIMEOUT_MS );
              await page.keyboard.press( pressKey );
              await page.waitForTimeout( tabDelay );
              const ariaLive = await ariaLivePromise;
              return {
                success: true,
                command: cmd,
                action: `Tabbed ${i + 1} time(s), found "${targetName}", pressed ${pressKey}`,
                focus: await getFocusInfo( page ),
                ariaLive: ariaLive.length > 0 ? ariaLive : undefined
              };
            }
            else {
              return {
                success: true,
                command: cmd,
                action: `Tabbed ${i + 1} time(s), found "${targetName}"`,
                focus: await getFocusInfo( page )
              };
            }
          }
        }

        // Somehow the entire document shows up as the accessible name of an item,
        // try to filter it out.
        const uniqueArrayItems = Array.from( new Set( availableFocus.filter( name => name.length < 100 ) ) );
        const focusRestored = await restoreOriginalFocus();

        return {
          success: false,
          command: cmd,
          action: `Failed to find "${targetName}" after ${maxTabs} tabs. Available = ${uniqueArrayItems.join( ' | ' )}${focusRestored ? ' (restored original focus)' : ''}`,
          focus: await getFocusInfo( page ),
          error: `Target "${targetName}" not found`
        };
      }
      finally {
        await originalFocusHandle.dispose();
      }
    }

    // Navigate to a new URL
    if ( 'navigate' in cmd ) {
      const url = cmd.navigate;
      try {
        simReadyRef.current = false;
        pageErrorsRef.current = []; // Clear errors when navigating to new page
        await page.goto( url, { waitUntil: 'load' } );

        // Wait for sim to be ready (up to 30 seconds)
        const maxWaitTime = 30000;
        const startTime = Date.now();
        while ( !simReadyRef.current && ( Date.now() - startTime ) < maxWaitTime ) {
          await page.waitForTimeout( 100 );
        }

        if ( !simReadyRef.current ) {
          return {
            success: false,
            command: cmd,
            action: `Navigated to ${url} but sim did not become ready within ${maxWaitTime}ms`,
            focus: await getFocusInfo( page ),
            error: 'Sim ready timeout'
          };
        }

        return {
          success: true,
          command: cmd,
          action: `Navigated to ${url}`,
          focus: await getFocusInfo( page )
        };
      }
      catch( error ) {
        return {
          success: false,
          command: cmd,
          action: `Failed to navigate to ${url}`,
          focus: await getFocusInfo( page ),
          error: ( error as Error ).message
        };
      }
    }

    // Screenshot
    if ( 'screenshot' in cmd ) {
      const filePath = cmd.screenshot;
      await page.screenshot( { path: filePath, fullPage: false } );
      return {
        success: true,
        command: cmd,
        action: `Screenshot saved to ${filePath}`,
        focus: await getFocusInfo( page )
      };
    }

    // Unknown command
    return {
      success: false,
      command: cmd,
      focus: await getFocusInfo( page ),
      error: 'Unknown command type'
    };
  }
  catch( error ) {
    return {
      success: false,
      command: cmd,
      focus: await getFocusInfo( page ),
      error: ( error as Error ).message
    };
  }
}

export const keyboardDaemon = ( async () => {
  const targetUrl = buildTargetUrl();
  const daemonPort = Number( getOptionIfProvided( 'daemonPort', `${DEFAULT_DAEMON_PORT}` ) );

  console.log( '[interact-daemon]' );
  console.log( `[interact-daemon] Launching ${targetUrl}` );
  console.log( `[interact-daemon] HTTP server will start on port ${daemonPort}` );
  console.log( '[interact-daemon]' );

  const simReadyRef = { current: false };
  const pageErrorsRef = { current: [] as string[] };

  await playwrightLoad( targetUrl, {
    testingBrowserCreator: playwright.chromium,
    logConsoleOutput: true,
    resolveFromLoad: false,
    waitAfterLoad: 0,
    allowedTimeToLoad: 60000,
    gotoTimeout: 45000,
    rejectPageErrors: false, // Don't crash on page errors - we capture and report them
    rejectErrors: false, // Don't crash on browser errors
    onLoadTimeout: ( resolve: () => void, reject: ( error: Error ) => void ) => reject( new Error( `Timed out waiting for ${TARGET_MESSAGE}` ) ),
    onPageCreation: async ( page: playwright.Page, resolve: ( value: unknown ) => void ) => {

      page.on( 'console', ( msg: playwright.ConsoleMessage ) => {
        const text = msg.text();
        if ( text.includes( TARGET_MESSAGE ) && !simReadyRef.current ) {
          simReadyRef.current = true;
          console.log( '[interact-daemon] ✓ Sim ready' );
          console.log( '[interact-daemon]' );
        }
      } );

      // Capture page errors instead of crashing
      page.on( 'pageerror', ( error: Error ) => {
        const errorMsg = error.message || String( error );
        console.log( `[interact-daemon] Page error: ${errorMsg}` );
        pageErrorsRef.current.push( errorMsg );
      } );

      // Start HTTP server
      const server = http.createServer( async ( req, res ) => {
        res.setHeader( 'Content-Type', 'application/json' );
        res.setHeader( 'Access-Control-Allow-Origin', '*' );
        res.setHeader( 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS' );
        res.setHeader( 'Access-Control-Allow-Headers', 'Content-Type' );

        if ( req.method === 'OPTIONS' ) {
          res.writeHead( 200 );
          res.end();
          return;
        }

        // Status endpoint
        if ( req.url === '/status' && req.method === 'GET' ) {
          res.writeHead( 200 );
          res.end( JSON.stringify( {
            ready: simReadyRef.current,
            url: page.url(),
            focus: simReadyRef.current ? await getFocusInfo( page ) : null,
            pageErrors: pageErrorsRef.current.length > 0 ? pageErrorsRef.current : undefined
          }, null, 2 ) );
          return;
        }

        // Reload endpoint
        if ( req.url === '/reload' && req.method === 'POST' ) {
          try {
            console.log( '[interact-daemon] Reloading page...' );
            simReadyRef.current = false;
            pageErrorsRef.current = []; // Clear errors on reload
            await page.reload( { waitUntil: 'load' } );
            await page.waitForTimeout( 1000 );
            res.writeHead( 200 );
            res.end( JSON.stringify( { success: true, message: 'Page reloaded' }, null, 2 ) );
          }
          catch( error ) {
            res.writeHead( 500 );
            res.end( JSON.stringify( { success: false, error: ( error as Error ).message }, null, 2 ) );
          }
          return;
        }

        // Command endpoint
        if ( req.url === '/cmd' && req.method === 'POST' ) {
          let body = '';
          req.on( 'data', chunk => {
            body += chunk.toString();
          } );

          req.on( 'end', async () => {
            try {
              const payload = JSON.parse( body );
              const commands = payload.commands || [];
              const continueOnError = payload.continueOnError || false;

              if ( !Array.isArray( commands ) || commands.length === 0 ) {
                res.writeHead( 400 );
                res.end( JSON.stringify( { error: 'No commands provided (expected "commands" array)' }, null, 2 ) );
                return;
              }

              const results: CommandResult[] = [];
              for ( const cmd of commands ) {
                // Check if sim is ready, but allow navigate commands to proceed regardless
                if ( !simReadyRef.current && !( 'navigate' in cmd ) ) {
                  results.push( {
                    success: false,
                    command: cmd,
                    focus: { name: 'unknown', role: '' },
                    error: 'Sim not ready yet (use navigate command to load a new sim)'
                  } );
                  if ( !continueOnError ) {
                    break;
                  }
                  continue;
                }

                const result = await executeCommand( page, cmd, simReadyRef, pageErrorsRef );

                // Include any page errors that occurred during command execution
                if ( pageErrorsRef.current.length > 0 ) {
                  result.pageErrors = [ ...pageErrorsRef.current ];
                  pageErrorsRef.current = []; // Clear after reporting
                }

                results.push( result );
                console.log( `[interact-daemon] ${JSON.stringify( cmd )} → ${result.action || result.error}` );

                // Stop on error unless continueOnError is set
                if ( !result.success && !continueOnError ) {
                  break;
                }
              }

              res.writeHead( 200 );
              res.end( JSON.stringify( results, null, 2 ) );
            }
            catch( error ) {
              res.writeHead( 400 );
              res.end( JSON.stringify( { error: ( error as Error ).message }, null, 2 ) );
            }
          } );
          return;
        }

        // 404
        res.writeHead( 404 );
        res.end( JSON.stringify( { error: 'Not found' }, null, 2 ) );
      } );

      server.listen( daemonPort, () => {
        console.log( `[interact-daemon] ✓ HTTP server listening on http://localhost:${daemonPort}` );
        console.log( '[interact-daemon]' );
        console.log( '[interact-daemon] Available endpoints:' );
        console.log( '[interact-daemon]   GET  /status  - Check daemon status and current focus' );
        console.log( '[interact-daemon]   POST /cmd     - Execute command(s)' );
        console.log( '[interact-daemon]   POST /reload  - Reload the simulation page' );
        console.log( '[interact-daemon]' );
        console.log( '[interact-daemon] Example commands (use -s to suppress progress meter):' );
        console.log( `[interact-daemon]   curl -s http://localhost:${daemonPort}/status | jq` );
        console.log( `[interact-daemon]   curl -s -X POST http://localhost:${daemonPort}/cmd -d '{"commands":[{"tab":5}]}' | jq` );
        console.log( `[interact-daemon]   curl -s -X POST http://localhost:${daemonPort}/cmd -d '{"commands":[{"find":"Values","press":"Space"}]}' | jq` );
        console.log( `[interact-daemon]   curl -s -X POST http://localhost:${daemonPort}/reload | jq` );
        console.log( '[interact-daemon]' );
        console.log( '[interact-daemon] Press Ctrl+C to stop the daemon' );
        console.log( '[interact-daemon]' );
      } );

      // Keep daemon running - never resolve
      // User will Ctrl+C to stop
    },
    launchOptions: {
      headless: false,
      args: [
        '--enable-webgl',
        '--use-gl=angle'
      ]
    }
  } );
} )();
