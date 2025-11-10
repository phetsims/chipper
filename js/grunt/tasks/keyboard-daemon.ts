// Copyright 2025, University of Colorado Boulder

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
 * grunt keyboard-daemon --screens=2
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
 * curl http://localhost:3001/status | jq
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
 * curl -X POST http://localhost:3001/cmd \
 *   -H "Content-Type: application/json" \
 *   -d '{"commands": [{"tab": 5}, {"find": "Values", "press": "Space"}]}' | jq
 * ```
 *
 * ### POST /reload
 * Reload the simulation page (useful when things go wrong)
 * ```bash
 * curl -X POST http://localhost:3001/reload | jq
 * ```
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
 * Get the full PDOM tree:
 * ```json
 * { "getPDOM": true }
 * ```
 * Returns the entire accessible DOM as HTML. This is verbose - only request when needed.
 *
 * ### Timing
 *
 * Wait for a duration:
 * ```json
 * { "wait": 500 }
 * ```
 * Milliseconds. Useful for waiting for animations or async updates.
 *
 * ## Complete Example
 *
 * ```bash
 * curl -X POST http://localhost:3001/cmd \
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

import playwrightLoad from '../../../../perennial-alias/js/common/playwrightLoad.js';
import getOption, { getOptionIfProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import playwright from '../../../../perennial-alias/js/npm-dependencies/playwright.js';
import http from 'http';

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

  /** Full PDOM tree (only present for getPDOM commands) */
  pdom?: string;

  /** Error message if command failed */
  error?: string;
};

/**
 * A command to execute in the simulation.
 * Commands are plain objects with one primary property indicating the command type.
 */
type Command =
  | { tab: number }
  | { shiftTab: number }
  | { press: string }
  | { find: string; press?: string }
  | { getPDOM: true }
  | { getFocus: true }
  | { wait: number };

/**
 * Get information about the currently focused element.
 */
async function getFocusInfo( page: playwright.Page ): Promise<FocusInfo> {
  return page.evaluate( () => {
    // @ts-expect-error
    const activeElement = document.activeElement;

    // @ts-expect-error
    const activeElementId = activeElement && 'id' in activeElement ? ( activeElement as HTMLElement ).id : '';
    const accessibleName = activeElement?.getAttribute?.( 'aria-label' );
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
      value: value
    };
  } );
}

/**
 * Execute a single command in the simulation.
 */
async function executeCommand( page: playwright.Page, cmd: Command ): Promise<CommandResult> {
  const tabDelay = Number( getOptionIfProvided( 'tabDelay', `${TAB_DELAY_MS}` ) );

  try {
    // Tab forward
    if ( 'tab' in cmd ) {
      const count = cmd.tab;
      for ( let i = 0; i < count; i++ ) {
        await page.keyboard.press( 'Tab' );
        await page.waitForTimeout( tabDelay );
      }
      return {
        success: true,
        command: cmd,
        action: `Tabbed ${count} time(s)`,
        focus: await getFocusInfo( page )
      };
    }

    // Tab backward
    if ( 'shiftTab' in cmd ) {
      const count = cmd.shiftTab;
      for ( let i = 0; i < count; i++ ) {
        await page.keyboard.press( 'Shift+Tab' );
        await page.waitForTimeout( tabDelay );
      }
      return {
        success: true,
        command: cmd,
        action: `Shift+Tabbed ${count} time(s)`,
        focus: await getFocusInfo( page )
      };
    }

    // Press a key
    if ( 'press' in cmd ) {
      const key = cmd.press;
      // @ts-expect-error
      await page.keyboard.press( key );
      await page.waitForTimeout( tabDelay );
      return {
        success: true,
        command: cmd,
        action: `Pressed ${key}`,
        focus: await getFocusInfo( page )
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

    // Get PDOM
    if ( 'getPDOM' in cmd ) {
      const pdom = await page.evaluate( () => {
        // @ts-expect-error
        const appDiv = document.querySelector( '[id$="-display"]' ) || document.querySelector( '[role="application"]' ) || document.body;
        return appDiv?.outerHTML || '<no PDOM found>';
      } );
      return {
        success: true,
        command: cmd,
        action: 'Retrieved PDOM',
        focus: await getFocusInfo( page ),
        pdom: pdom
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
      const pressKey = cmd.press || 'Space';
      const maxTabs = Number( getOptionIfProvided( 'tabPressCount', `${TAB_PRESS_COUNT}` ) );

      for ( let i = 0; i < maxTabs; i++ ) {
        await page.keyboard.press( 'Tab' );
        await page.waitForTimeout( tabDelay );
        const focus = await getFocusInfo( page );

        if ( focus.name === targetName ) {
          await page.keyboard.press( pressKey );
          await page.waitForTimeout( tabDelay );
          return {
            success: true,
            command: cmd,
            action: `Tabbed ${i + 1} time(s), found "${targetName}", pressed ${pressKey}`,
            focus: await getFocusInfo( page )
          };
        }
      }

      return {
        success: false,
        command: cmd,
        action: `Failed to find "${targetName}" after ${maxTabs} tabs`,
        focus: await getFocusInfo( page ),
        error: `Target "${targetName}" not found`
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

  console.log( '[keyboard-daemon]' );
  console.log( `[keyboard-daemon] Launching ${targetUrl}` );
  console.log( `[keyboard-daemon] HTTP server will start on port ${daemonPort}` );
  console.log( '[keyboard-daemon]' );

  let simReady = false;

  await playwrightLoad( targetUrl, {
    testingBrowserCreator: playwright.chromium,
    logConsoleOutput: true,
    resolveFromLoad: false,
    waitAfterLoad: 0,
    allowedTimeToLoad: 60000,
    gotoTimeout: 45000,
    onLoadTimeout: ( resolve: () => void, reject: ( error: Error ) => void ) => reject( new Error( `Timed out waiting for ${TARGET_MESSAGE}` ) ),
    onPageCreation: async ( page: playwright.Page, resolve: ( value: unknown ) => void ) => {

      page.on( 'console', ( msg: playwright.ConsoleMessage ) => {
        const text = msg.text();
        if ( text.includes( TARGET_MESSAGE ) && !simReady ) {
          simReady = true;
          console.log( '[keyboard-daemon] ✓ Sim ready' );
          console.log( '[keyboard-daemon]' );
        }
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
            ready: simReady,
            url: targetUrl,
            focus: simReady ? await getFocusInfo( page ) : null
          }, null, 2 ) );
          return;
        }

        // Reload endpoint
        if ( req.url === '/reload' && req.method === 'POST' ) {
          try {
            console.log( '[keyboard-daemon] Reloading page...' );
            simReady = false;
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
          if ( !simReady ) {
            res.writeHead( 503 );
            res.end( JSON.stringify( { error: 'Sim not ready yet' }, null, 2 ) );
            return;
          }

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
                const result = await executeCommand( page, cmd );
                results.push( result );
                console.log( `[keyboard-daemon] ${JSON.stringify( cmd )} → ${result.action || result.error}` );

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
        console.log( `[keyboard-daemon] ✓ HTTP server listening on http://localhost:${daemonPort}` );
        console.log( '[keyboard-daemon]' );
        console.log( '[keyboard-daemon] Available endpoints:' );
        console.log( '[keyboard-daemon]   GET  /status  - Check daemon status and current focus' );
        console.log( '[keyboard-daemon]   POST /cmd     - Execute command(s)' );
        console.log( '[keyboard-daemon]   POST /reload  - Reload the simulation page' );
        console.log( '[keyboard-daemon]' );
        console.log( '[keyboard-daemon] Example commands:' );
        console.log( `[keyboard-daemon]   curl http://localhost:${daemonPort}/status | jq` );
        console.log( `[keyboard-daemon]   curl -X POST http://localhost:${daemonPort}/cmd -d '{"commands":[{"tab":5}]}' | jq` );
        console.log( `[keyboard-daemon]   curl -X POST http://localhost:${daemonPort}/cmd -d '{"commands":[{"find":"Values","press":"Space"}]}' | jq` );
        console.log( `[keyboard-daemon]   curl -X POST http://localhost:${daemonPort}/reload | jq` );
        console.log( '[keyboard-daemon]' );
        console.log( '[keyboard-daemon] Press Ctrl+C to stop the daemon' );
        console.log( '[keyboard-daemon]' );
      } );

      // Keep daemon running - never resolve
      // User will Ctrl+C to stop
    },
    launchOptions: {
      headless: false
    }
  } );
} )();
