// Copyright 2025, University of Colorado Boulder

/* eslint-disable */
// @ts-nocheck

/**
 * Simplified CLI for interacting with the keyboard daemon.
 *
 * This tool provides a human-friendly interface to the keyboard daemon API,
 * eliminating the need for curl, JSON construction, and jq parsing.
 *
 * ## Prerequisites
 *
 * The keyboard daemon must be running in another terminal:
 * ```bash
 * cd your-sim-repo
 * grunt keyboard-daemon --screens=2
 * ```
 *
 * ## Basic Usage
 *
 * Single commands:
 * ```bash
 * grunt interact look                    # Survey the simulation
 * grunt interact status                  # Check daemon status
 * grunt interact tab 5                   # Tab forward 5 times
 * grunt interact shiftTab 3              # Tab backward 3 times
 * grunt interact press Space             # Press a key
 * grunt interact find "Reset All"        # Find and activate element
 * grunt interact wait 500                # Wait 500ms
 * grunt interact getFocus                # Get current focus
 * grunt interact reload                  # Reload the simulation
 * ```
 *
 * Find with custom key:
 * ```bash
 * grunt interact find "Submit" --press=Enter
 * ```
 *
 * Navigate to a different simulation:
 * ```bash
 * grunt interact navigate "http://localhost/number-pairs/number-pairs_en.html?brand=phet-io&ea&debugger"
 * ```
 *
 * ## Command Sequences
 *
 * Chain multiple commands using `+` separator:
 * ```bash
 * grunt interact tab 10 + find "Show Current" + wait 100 + look
 * grunt interact find "Lab" + wait 200 + find "Keyboard Shortcuts" + look
 * ```
 *
 * ## Options
 *
 * - `--daemonPort=3001` - Port the daemon is listening on (default: 3001)
 * - `--daemonHost=localhost` - Host the daemon is on (default: localhost)
 * - `--continueOnError` - Continue executing commands even if one fails
 * - `--press=KEY` - Key to press for find commands (default: Space)
 * - `--raw` - Output raw JSON response (no formatting)
 * - `--json` - Alias for --raw
 * - `--debug` - Show debug output (useful for troubleshooting)
 *
 * ## Examples
 *
 * Basic interaction workflow:
 * ```bash
 * # Survey the simulation
 * grunt interact look
 *
 * # Open keyboard help
 * grunt interact find "Keyboard Shortcuts"
 *
 * # Survey again to see the help dialog
 * grunt interact look
 *
 * # Navigate and interact
 * grunt interact find "Lab" + wait 200 + look
 * grunt interact tab 5 + press ArrowDown
 * ```
 *
 * Using different daemon port:
 * ```bash
 * grunt interact --daemonPort=3002 look
 * ```
 *
 * Continue on error:
 * ```bash
 * grunt interact --continueOnError find "Nonexistent" + look
 * ```
 *
 * ## Output Format
 *
 * By default, output is formatted for readability:
 * - Focus information is shown prominently
 * - ARIA live announcements are highlighted
 * - Errors are clearly marked
 * - PDOM and focus order (for look commands) are displayed
 *
 * Use `--raw` or `--json` for machine-readable JSON output.
 *
 * ## Design for LLM Agents
 *
 * This tool is optimized for both human and AI usage:
 * - Simple, consistent command syntax
 * - Composable command sequences
 * - Clear, structured output
 * - Minimal token overhead
 * - All keyboard-daemon features accessible
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

 

import http from 'http';
import getOptionIfProvided from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';

const DEFAULT_DAEMON_PORT = 3001;
const DEFAULT_DAEMON_HOST = 'localhost';

/**
 * Parse command line arguments into Command objects.
 * Supports both single commands and sequences separated by '+'.
 */
function parseCommands( args: string[], getOptionFn: ( name: string, defaultValue?: string ) => string | undefined ): IntentionalAny[] {
  const commands: IntentionalAny[] = [];
  const commandStrings: string[] = [];

  // Split args by '+' to support command sequences
  let currentCommand: string[] = [];
  for ( const arg of args ) {
    if ( arg === '+' ) {
      if ( currentCommand.length > 0 ) {
        commandStrings.push( currentCommand.join( ' ' ) );
        currentCommand = [];
      }
    }
    else {
      currentCommand.push( arg );
    }
  }
  if ( currentCommand.length > 0 ) {
    commandStrings.push( currentCommand.join( ' ' ) );
  }

  // Parse each command string
  for ( const cmdStr of commandStrings ) {
    const parts = cmdStr.trim().split( /\s+/ );
    if ( parts.length === 0 ) {continue;}

    const cmdType = parts[ 0 ].toLowerCase();

    switch ( cmdType ) {
      case 'look':
        commands.push( { look: true } );
        break;

      case 'getfocus':
      case 'focus':
        commands.push( { getFocus: true } );
        break;

      case 'tab':
        if ( parts.length < 2 ) {
          throw new Error( 'tab command requires a count: grunt interact tab 5' );
        }
        const tabCount = parseInt( parts[ 1 ], 10 );
        if ( isNaN( tabCount ) || tabCount <= 0 ) {
          throw new Error( `Invalid tab count: ${parts[ 1 ]}` );
        }
        commands.push( { tab: tabCount } );
        break;

      case 'shifttab':
      case 'shift-tab':
        if ( parts.length < 2 ) {
          throw new Error( 'shiftTab command requires a count: grunt interact shiftTab 3' );
        }
        const shiftTabCount = parseInt( parts[ 1 ], 10 );
        if ( isNaN( shiftTabCount ) || shiftTabCount <= 0 ) {
          throw new Error( `Invalid shiftTab count: ${parts[ 1 ]}` );
        }
        commands.push( { shiftTab: shiftTabCount } );
        break;

      case 'press':
        if ( parts.length < 2 ) {
          throw new Error( 'press command requires a key: grunt interact press Space' );
        }
        commands.push( { press: parts[ 1 ] } );
        break;

      case 'find':
        if ( parts.length < 2 ) {
          throw new Error( 'find command requires a target name: grunt interact find "Reset All"' );
        }
        // Join remaining parts as the target name (handles quoted strings)
        const targetName = parts.slice( 1 ).join( ' ' ).replace( /^["']|["']$/g, '' );
        const findCmd: IntentionalAny = { find: targetName };

        // Check for --press option
        const pressOption = getOptionFn( 'press' );
        if ( pressOption ) {
          findCmd.press = pressOption;
        }

        commands.push( findCmd );
        break;

      case 'wait':
        if ( parts.length < 2 ) {
          throw new Error( 'wait command requires milliseconds: grunt interact wait 500' );
        }
        const waitMs = parseInt( parts[ 1 ], 10 );
        if ( isNaN( waitMs ) || waitMs < 0 ) {
          throw new Error( `Invalid wait duration: ${parts[ 1 ]}` );
        }
        commands.push( { wait: waitMs } );
        break;

      case 'navigate':
        if ( parts.length < 2 ) {
          throw new Error( 'navigate command requires a URL: grunt interact navigate "http://..."' );
        }
        const url = parts.slice( 1 ).join( ' ' ).replace( /^["']|["']$/g, '' );
        commands.push( { navigate: url } );
        break;

      default:
        throw new Error( `Unknown command: ${cmdType}. Valid commands: look, getFocus, tab, shiftTab, press, find, wait, navigate` );
    }
  }

  return commands;
}

/**
 * Make an HTTP request to the daemon.
 */
function makeRequest( host: string, port: number, path: string, method: string, body?: string, debug = false ): Promise<string> {
  return new Promise( ( resolve, reject ) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if ( debug ) {
      console.log( `Debug: ${method} http://${host}:${port}${path}` );
      if ( body ) {
        console.log( 'Debug: body =', body );
      }
    }

    const req = http.request( options, res => {
      let data = '';
      res.on( 'data', chunk => {
        data += chunk;
      } );
      res.on( 'end', () => {
        if ( res.statusCode && res.statusCode >= 200 && res.statusCode < 300 ) {
          resolve( data );
        }
        else {
          reject( new Error( `HTTP ${res.statusCode}: ${data}` ) );
        }
      } );
    } );

    req.on( 'error', err => {
      reject( new Error( `Failed to connect to daemon at ${host}:${port}. Is the daemon running? (${err.message})` ) );
    } );

    if ( body ) {
      req.write( body );
    }
    req.end();
  } );
}

/**
 * Format command results for human-readable output.
 */
function formatResults( results: IntentionalAny[] ): string {
  const lines: string[] = [];

  for ( let i = 0; i < results.length; i++ ) {
    const result = results[ i ];

    if ( results.length > 1 ) {
      lines.push( `\n[${ i + 1 }] ${JSON.stringify( result.command )}` );
      lines.push( '─'.repeat( 60 ) );
    }

    if ( !result.success ) {
      lines.push( `❌ ERROR: ${result.error || 'Unknown error'}` );
      if ( result.action ) {
        lines.push( `   ${result.action}` );
      }
    }
    else if ( result.action ) {
      lines.push( `✓ ${result.action}` );
    }

    // Focus information
    if ( result.focus ) {
      const focus = result.focus;
      let focusLine = `Focus: ${focus.name}`;
      if ( focus.role ) {
        focusLine += ` (${focus.role})`;
      }
      if ( focus.checked !== undefined ) {
        focusLine += ` [${focus.checked ? 'checked' : 'unchecked'}]`;
      }
      if ( focus.value !== undefined ) {
        focusLine += ` value="${focus.value}"`;
      }
      lines.push( focusLine );
    }

    // ARIA live announcements
    if ( result.ariaLive && result.ariaLive.length > 0 ) {
      lines.push( '\n🔊 ARIA Live Announcements:' );
      for ( const announcement of result.ariaLive ) {
        lines.push( `   "${announcement}"` );
      }
    }

    // PDOM (for look commands)
    if ( result.pdom ) {
      lines.push( '\n📄 PDOM (>>> marks focused element):' );
      lines.push( result.pdom );
    }

    // Focus order (for look commands)
    if ( result.focusOrder && result.focusOrder.length > 0 ) {
      lines.push( '\n🎯 Focus Order (tab stops):' );
      for ( let j = 0; j < result.focusOrder.length; j++ ) {
        const marker = result.focus && result.focusOrder[ j ] === result.focus.name ? '>>> ' : '    ';
        lines.push( `${marker}${j + 1}. ${result.focusOrder[ j ]}` );
      }
    }
  }

  return lines.join( '\n' );
}

/**
 * Parse command line options that work with both grunt and sage run.
 */
function getOption( name: string, defaultValue?: string ): string | undefined {
  // Try grunt's option parser first
  const gruntValue = getOptionIfProvided<string>( name, undefined );
  if ( gruntValue !== undefined ) {
    return gruntValue;
  }

  // Fall back to manual parsing for sage run
  const prefix = `--${name}=`;
  for ( const arg of process.argv ) {
    if ( arg.startsWith( prefix ) ) {
      return arg.substring( prefix.length );
    }
    if ( arg === `--${name}` ) {
      return 'true';
    }
  }

  return defaultValue;
}

export const interact = ( async () => {
  const daemonPort = Number( getOption( 'daemonPort', `${DEFAULT_DAEMON_PORT}` ) );
  const daemonHost = getOption( 'daemonHost', DEFAULT_DAEMON_HOST );
  const continueOnError = getOption( 'continueOnError' ) !== undefined;
  const rawOutput = getOption( 'raw' ) !== undefined || getOption( 'json' ) !== undefined;
  const debug = getOption( 'debug' ) !== undefined;

  // Get all non-option arguments
  // Handle both grunt (grunt interact look) and sage run (sage run interact.ts look) invocations
  const args: string[] = [];

  // Detect if running via sage/ts-node (argv[1] is the script) vs grunt (argv[1] is grunt binary)
  const isSageRun = process.argv[ 1 ].endsWith( '.ts' ) || process.argv[ 1 ].endsWith( '.js' );
  const startIndex = isSageRun ? 2 : 3; // sage: skip node + script, grunt: skip node + grunt + interact

  for ( let i = startIndex; i < process.argv.length; i++ ) {
    const arg = process.argv[ i ];

    // Skip option flags
    if ( arg.startsWith( '--' ) ) {
      continue;
    }

    args.push( arg );
  }

  if ( debug ) {
    console.log( `Debug: running via ${isSageRun ? 'sage/ts-node' : 'grunt'}` );
    console.log( 'Debug: process.argv =', process.argv );
    console.log( 'Debug: parsed args =', args );
    console.log( `Debug: daemon = ${daemonHost}:${daemonPort}` );
  }

  // Special handling for status and reload (they use different endpoints)
  if ( args.length === 1 && args[ 0 ] === 'status' ) {
    try {
      const response = await makeRequest( daemonHost, daemonPort, '/status', 'GET', undefined, debug );
      if ( rawOutput ) {
        console.log( response );
      }
      else {
        const status = JSON.parse( response );
        console.log( '📊 Daemon Status' );
        console.log( '─'.repeat( 60 ) );
        console.log( `Ready: ${status.ready ? '✓' : '✗'}` );
        console.log( `URL: ${status.url}` );
        if ( status.focus ) {
          console.log( `Focus: ${status.focus.name} (${status.focus.role})` );
        }
      }
      return;
    }
    catch( error ) {
      console.error( `Error: ${( error as Error ).message}` );
      process.exit( 1 );
    }
  }

  if ( args.length === 1 && args[ 0 ] === 'reload' ) {
    try {
      const response = await makeRequest( daemonHost, daemonPort, '/reload', 'POST', undefined, debug );
      if ( rawOutput ) {
        console.log( response );
      }
      else {
        const result = JSON.parse( response );
        if ( result.success ) {
          console.log( '✓ Page reloaded successfully' );
        }
        else {
          console.error( `❌ Reload failed: ${result.error}` );
          process.exit( 1 );
        }
      }
      return;
    }
    catch( error ) {
      console.error( `Error: ${( error as Error ).message}` );
      process.exit( 1 );
    }
  }

  // Parse commands
  if ( args.length === 0 ) {
    console.error( 'Error: No command specified' );
    console.error( '\nUsage: grunt interact <command> [args]' );
    console.error( '\nCommands:' );
    console.error( '  status                   - Check daemon status' );
    console.error( '  reload                   - Reload the simulation' );
    console.error( '  look                     - Survey simulation (PDOM + focus order)' );
    console.error( '  getFocus                 - Get current focus' );
    console.error( '  tab <count>              - Tab forward N times' );
    console.error( '  shiftTab <count>         - Tab backward N times' );
    console.error( '  press <key>              - Press a key' );
    console.error( '  find "<name>"            - Find and activate element' );
    console.error( '  find "<name>" --press=KEY - Find and press specific key' );
    console.error( '  wait <ms>                - Wait milliseconds' );
    console.error( '  navigate "<url>"         - Navigate to URL' );
    console.error( '\nChain commands with +: grunt interact tab 5 + find "Reset All" + look' );
    console.error( '\nOptions:' );
    console.error( '  --daemonPort=3001        - Daemon port (default: 3001)' );
    console.error( '  --daemonHost=localhost   - Daemon host (default: localhost)' );
    console.error( '  --continueOnError        - Continue on command failure' );
    console.error( '  --press=KEY              - Key for find commands (default: Space)' );
    console.error( '  --raw or --json          - Output raw JSON' );
    console.error( '  --debug                  - Show debug output' );
    process.exit( 1 );
  }

  let commands: IntentionalAny[];
  try {
    commands = parseCommands( args, getOption );
  }
  catch( error ) {
    console.error( `Parse error: ${( error as Error ).message}` );
    process.exit( 1 );
  }

  // Execute commands
  try {
    const payload = {
      commands: commands,
      continueOnError: continueOnError
    };

    const response = await makeRequest(
      daemonHost,
      daemonPort,
      '/cmd',
      'POST',
      JSON.stringify( payload ),
      debug
    );

    const results = JSON.parse( response );

    if ( rawOutput ) {
      console.log( JSON.stringify( results, null, 2 ) );
    }
    else {
      console.log( formatResults( results ) );
    }

    // Exit with error code if any command failed
    const anyFailed = results.some( ( r: IntentionalAny ) => !r.success );
    if ( anyFailed ) {
      process.exit( 1 );
    }
  }
  catch( error ) {
    console.error( `Error: ${( error as Error ).message}` );
    process.exit( 1 );
  }
} )();
