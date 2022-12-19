// Copyright 2022, University of Colorado Boulder

/**
 * The tsc type checker outputs type errors using relative paths only, which are not hyperlinked in WebStorm and IntelliJ.
 * This thin wrapper uses a heuristic to convert the relative paths to absolute paths.  Combined with an "output filter",
 * this makes the type errors clickable in the tool output panel.
 *
 * To support CacheLayer, this must be run from chipper/
 *
 * Usage from command line:
 * cd chipper/
 * node js/scripts/absolute-tsc.js {{TS_CONFIG_DIRECTORY}}
 * node js/scripts/absolute-tsc.js ../chipper/tsconfig/all
 *
 * Configure WebStorm with the following external tool:
 * program: node
 * arguments: js/scripts/absolute-tsc.js ${dir with a tsconfig, like ../chipper/tsconfig/all}
 * working dir: ${chipper/, like /Users/samreid/apache-document-root/main/chipper}
 *
 * To share a cache with pre-commit-hooks use: ../chipper/tsconfig/all
 *
 * IMPORTANT!!! This makes the files paths clickable in Webstorm:
 * output filters: $FILE_PATH$\($LINE$\,$COLUMN$\)
 *
 * If you run into a memory error, consider setting the environment variable like so:
 * export NODE_OPTIONS=--max_old_space_size=4096
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const start = Date.now();
const execute = require( '../../../perennial-alias/js/common/execute' );
const CacheLayer = require( '../common/CacheLayer' );
const os = require( 'os' );
const path = require( 'path' );
const { resolve } = require( 'path' ); // eslint-disable-line require-statement-match

const args = process.argv.slice( 2 );
if ( !args || args.length === 0 ) {
  console.log( 'usage: path to dir with a tsconfig file' );
}

( async () => {

  const cacheKey = 'absolute-tsc#' + args[ 0 ];
  if ( CacheLayer.isCacheSafe( cacheKey ) ) {
    // console.log( 'cache safe for: ' + cacheKey );
    return;
  }

  // console.log( 'changes detected...' );

  const results = await execute( 'node', [ `${__dirname}/../../../chipper/node_modules/typescript/bin/tsc` ], args[ 0 ], {
    errors: 'resolve'
  } );

  // If there was a problem running tsc, report it here.  The type errors are reported on stdout below.
  if ( results.stderr.length > 0 ) {
    console.log( results );
  }
  const end = Date.now();
  const elapsed = end - start;

  if ( results.stdout.trim().length === 0 ) {

    console.log( `0 errors in ${elapsed}ms` );
    CacheLayer.onSuccess( cacheKey );
  }
  else {
    const lines = results.stdout.trim().split( os.EOL );
    const mapped = lines.map( line => {

      if ( line.includes( '): error TS' ) ) {
        const parenthesesIndex = line.indexOf( '(' );

        const linePath = line.substring( 0, parenthesesIndex );
        const resolved = resolve( process.cwd() + path.sep + args[ 0 ] + path.sep + linePath );
        return resolved + line.substring( parenthesesIndex );
      }
      else {
        return line;
      }
    } );

    // If a line starts without whitespace, it begins a new error
    const errorCount = mapped.filter( line => line === line.trim() ).length;

    console.log( mapped.join( '\n' ) );
    console.log( `${errorCount} ${errorCount === 1 ? 'error' : 'errors'} in ${elapsed}ms` );
    process.exit( 1 );
  }
} )();
