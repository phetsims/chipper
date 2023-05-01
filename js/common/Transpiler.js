// Copyright 2021-2023, University of Colorado Boulder

/**
 * Transpiles *.ts and copies all *.js files to chipper/dist. Does not do type checking. Filters based on
 * perennial-alias/active-repos and subsets of directories within repos (such as js/, images/, and sounds/)
 *
 * See transpile.js for the CLI usage
 *
 *  @author Sam Reid (PhET Interactive Simulations)
 */

// imports
const fs = require( 'fs' );
const path = require( 'path' );
const crypto = require( 'crypto' );
const CacheLayer = require( './CacheLayer' );
const core = require( '@babel/core' );
const assert = require( 'assert' );
const _ = require( 'lodash' );

// Cache status is stored in chipper/dist so if you wipe chipper/dist you also wipe the cache
const statusPath = '../chipper/dist/js-cache-status.json';
const root = '..' + path.sep;

// Directories in a sim repo that may contain things for transpilation
// This is used for a top-down search in the initial transpilation and for filtering relevant files in the watch process
const subdirs = [ 'js', 'images', 'mipmaps', 'sounds', 'shaders', 'common',

  // phet-io-sim-specific has nonstandard directory structure
  'repos' ];

const getActiveRepos = () => fs.readFileSync( '../perennial-alias/data/active-repos', 'utf8' ).trim().split( '\n' ).map( sim => sim.trim() );

class Transpiler {

  constructor( options ) {

    options = _.extend( {
      clean: false, // delete the previous state/cache file, and create a new one.
      verbose: false, // Add extra logging
      silent: false, // hide all logging but error reporting, include any specified with verbose
      repos: [], // {string[]} additional repos to be transpiled (beyond those listed in perennial-alias/data/active-repos)
      brands: [] // {sting[]} additional brands to visit in the brand repo
    }, options );

    // @private
    this.verbose = options.verbose;
    this.silent = options.silent;
    this.repos = options.repos;
    this.brands = options.brands;

    // Track the status of each repo. Key= repo, value=md5 hash of contents
    this.status = {};

    // Handle the case where programs want to handle this itself and do something before exiting.
    if ( !global.processEventOptOut ) {

      // Exit on Ctrl + C case, but make sure to save the cache
      process.on( 'SIGINT', () => {
        this.saveCache();
        process.exit();
      } );
    }

    // Make sure a directory exists for the cached status file
    fs.mkdirSync( path.dirname( statusPath ), { recursive: true } );

    if ( options.clean ) {
      !this.silent && console.log( 'cleaning...' );
      fs.writeFileSync( statusPath, JSON.stringify( {}, null, 2 ) );
    }

    // Load cached status
    try {
      this.status = JSON.parse( fs.readFileSync( statusPath, 'utf-8' ) );
    }
    catch( e ) {
      !this.silent && console.log( 'couldn\'t parse status cache, making a clean one' );
      this.status = {};
      fs.writeFileSync( statusPath, JSON.stringify( this.status, null, 2 ) );
    }

    // Use the same implementation as getRepoList, but we need to read from perennial-alias since chipper should not
    // depend on perennial.
    this.activeRepos = getActiveRepos();
  }

  /**
   * Returns the path in chipper/dist that corresponds to a source file.
   * @param filename
   * @returns {string}
   * @public
   */
  static getTargetPath( filename ) {
    const relativePath = path.relative( root, filename );
    const suffix = relativePath.substring( relativePath.lastIndexOf( '.' ) );

    // Note: When we upgrade to Node 16, this may no longer be necessary, see https://github.com/phetsims/chipper/issues/1272#issuecomment-1222574593
    const extension = relativePath.includes( 'phet-build-script' ) ? '.mjs' : '.js';
    return Transpiler.join( root, 'chipper', 'dist', 'js', ...relativePath.split( path.sep ) ).split( suffix ).join( extension );
  }

  /**
   * Transpile the file using babel, and write it to the corresponding location in chipper/dist
   * @param {string} sourceFile
   * @param {string} targetPath
   * @param {string} text - file text
   * @private
   */
  static transpileFunction( sourceFile, targetPath, text ) {
    const x = core.transformSync( text, {
      filename: sourceFile,

      // Load directly from node_modules so we do not have to npm install this dependency
      // in every sim repo.  This strategy is also used in transpile.js
      presets: [
        '../chipper/node_modules/@babel/preset-typescript',
        '../chipper/node_modules/@babel/preset-react'
      ],
      sourceMaps: 'inline',

      plugins: [
        [ '../chipper/node_modules/@babel/plugin-proposal-decorators', { version: '2022-03' } ]
      ]
    } );

    fs.mkdirSync( path.dirname( targetPath ), { recursive: true } );
    fs.writeFileSync( targetPath, x.code );
  }

  // @public
  static modifiedTimeMilliseconds( file ) {
    return fs.statSync( file ).mtime.getTime();
  }

  // @public.  Delete any files in chipper/dist/js that don't have a corresponding file in the source tree
  pruneStaleDistFiles() {
    const startTime = Date.now();

    const start = '../chipper/dist/js/';

    const visitFile = path => {
      path = Transpiler.forwardSlashify( path );
      assert( path.startsWith( start ) );
      const tail = path.substring( start.length );

      const correspondingFile = `../${tail}`;
      const jsTsFile = correspondingFile.split( '.js' ).join( '.ts' );
      const jsTsxFile = correspondingFile.split( '.js' ).join( '.tsx' );
      const mjsTsFile = correspondingFile.split( '.mjs' ).join( '.ts' );
      const mjsTsxFile = correspondingFile.split( '.mjs' ).join( '.tsx' );
      if ( !fs.existsSync( correspondingFile ) &&
           !fs.existsSync( jsTsFile ) && !fs.existsSync( jsTsxFile ) &&
           !fs.existsSync( mjsTsFile ) && !fs.existsSync( mjsTsxFile )
      ) {
        fs.unlinkSync( path );
        console.log( 'No parent source file for: ' + path + ', deleted.' );
      }
    };

    // @private - Recursively visit a directory for files to transpile
    const visitDir = dir => {
      const files = fs.readdirSync( dir );
      files.forEach( file => {
        const child = Transpiler.join( dir, file );
        if ( fs.lstatSync( child ).isDirectory() && fs.existsSync( child ) ) {
          visitDir( child );
        }
        else if ( fs.existsSync( child ) && fs.lstatSync( child ).isFile() ) {
          visitFile( child );
        }
      } );
    };

    if ( fs.existsSync( start ) && fs.lstatSync( start ).isDirectory() ) {
      visitDir( start );
    }

    const endTime = Date.now();
    const elapsed = endTime - startTime;
    console.log( 'Clean stale chipper/dist/js files finished in ' + elapsed + 'ms' );
  }

  // @public join and normalize the paths (forward slashes for ease of search and readability)
  static join( ...paths ) {
    return Transpiler.forwardSlashify( path.join( ...paths ) );
  }

  /**
   * For *.ts and *.js files, checks if they have changed file contents since last transpile.  If so, the
   * file is transpiled.
   * @param {string} filePath
   * @private
   */
  visitFile( filePath ) {
    if ( ( filePath.endsWith( '.js' ) || filePath.endsWith( '.ts' ) || filePath.endsWith( '.tsx' ) ) && !this.isPathIgnored( filePath ) ) {
      const changeDetectedTime = Date.now();
      const text = fs.readFileSync( filePath, 'utf-8' );
      const hash = crypto.createHash( 'md5' ).update( text ).digest( 'hex' );

      // If the file has changed, transpile and update the cache.  We have to choose on the spectrum between safety
      // and performance.  In order to maintain high performance with a low error rate, we only write the transpiled file
      // if (a) the cache is out of date (b) there is no target file at all or (c) if the target file has been modified.
      const targetPath = Transpiler.getTargetPath( filePath );

      if ( !this.status[ filePath ] || this.status[ filePath ].sourceMD5 !== hash || !fs.existsSync( targetPath ) || this.status[ filePath ].targetMilliseconds !== Transpiler.modifiedTimeMilliseconds( targetPath ) ) {

        try {
          let reason = '';
          if ( this.verbose ) {
            reason = ( !this.status[ filePath ] ) ? ' (not cached)' : ( this.status[ filePath ].sourceMD5 !== hash ) ? ' (changed)' : ( !fs.existsSync( targetPath ) ) ? ' (no target)' : ( this.status[ filePath ].targetMilliseconds !== Transpiler.modifiedTimeMilliseconds( targetPath ) ) ? ' (target modified)' : '???';
          }
          Transpiler.transpileFunction( filePath, targetPath, text );

          this.status[ filePath ] = {
            sourceMD5: hash, targetMilliseconds: Transpiler.modifiedTimeMilliseconds( targetPath )
          };
          fs.writeFileSync( statusPath, JSON.stringify( this.status, null, 2 ) );
          const now = Date.now();
          const nowTimeString = new Date( now ).toLocaleTimeString();

          !this.silent && console.log( `${nowTimeString}, ${( now - changeDetectedTime )} ms: ${filePath}${reason}` );
        }
        catch( e ) {
          console.log( e );
          console.log( 'ERROR' );
        }
      }
    }
  }

  // @private - Recursively visit a directory for files to transpile
  visitDirectory( dir ) {
    if ( fs.existsSync( dir ) ) {
      const files = fs.readdirSync( dir );
      files.forEach( file => {
        const child = Transpiler.join( dir, file );
        if ( fs.lstatSync( child ).isDirectory() ) {
          this.visitDirectory( child );
        }
        else {
          this.visitFile( child );
        }
      } );
    }
  }

  // @private
  isPathIgnored( filePath ) {
    const withForwardSlashes = Transpiler.forwardSlashify( filePath );

    try {

      // ignore directories, just care about individual files
      // Try catch because there can still be a race condition between checking and lstatting. This covers enough cases
      // though to still keep it in.
      if ( fs.existsSync( filePath ) && fs.lstatSync( filePath ).isDirectory() ) {
        return true;
      }
    }
    catch( e ) { /* ignore please */ }

    return withForwardSlashes.includes( '/node_modules' ) ||
           withForwardSlashes.includes( '.git/' ) ||
           withForwardSlashes.includes( '/build/' ) ||
           withForwardSlashes.includes( 'chipper/dist/' ) ||
           withForwardSlashes.includes( 'transpile/cache/status.json' ) ||

           // Temporary files sometimes saved by the IDE
           withForwardSlashes.endsWith( '~' ) ||

           // eslint cache files
           withForwardSlashes.includes( '/chipper/eslint/cache/' ) ||
           withForwardSlashes.includes( '/perennial-alias/logs/' ) ||
           withForwardSlashes.endsWith( '.eslintcache' );
  }

  // @private
  static forwardSlashify( filePath ) {
    return filePath.split( '\\' ).join( '/' );
  }

  /**
   * Transpile the specified repos
   * @param {string[]} repos
   * @public
   */
  transpileRepos( repos ) {
    assert( Array.isArray( repos ), 'repos should be an array' );
    repos.forEach( repo => this.transpileRepo( repo ) );
  }

  // @public - Visit all the subdirectories in a repo that need transpilation
  transpileRepo( repo ) {
    subdirs.forEach( subdir => this.visitDirectory( Transpiler.join( '..', repo, subdir ) ) );
    if ( repo === 'sherpa' ) {

      // Our sims load this as a module rather than a preload, so we must transpile it
      this.visitFile( Transpiler.join( '..', repo, 'lib', 'game-up-camera-1.0.0.js' ) );
    }
    else if ( repo === 'brand' ) {
      this.visitDirectory( Transpiler.join( '..', repo, 'phet' ) );
      this.visitDirectory( Transpiler.join( '..', repo, 'phet-io' ) );
      this.visitDirectory( Transpiler.join( '..', repo, 'adapted-from-phet' ) );

      this.brands.forEach( brand => this.visitDirectory( Transpiler.join( '..', repo, brand ) ) );
    }
  }

  // @public
  transpileAll() {
    this.transpileRepos( [ ...this.activeRepos, ...this.repos ] );
  }

  // @private
  saveCache() {
    fs.writeFileSync( statusPath, JSON.stringify( this.status, null, 2 ) );
  }

  // @public
  watch() {

    // Invalidate caches when we start watching
    CacheLayer.updateLastChangedTimestamp();

    // For coordination with CacheLayer, clear the cache while we are not watching for file changes
    // https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
    process.stdin.resume();//so the program will not close instantly

    function exitHandler( options ) {

      // NOTE: this gets called 2x on ctrl-c for unknown reasons
      CacheLayer.clearLastChangedTimestamp();

      if ( options && options.exit ) {
        if ( options.arg ) {
          throw options.arg;
        }
        process.exit();
      }
    }

    // do something when app is closing
    process.on( 'exit', () => exitHandler() );

    // catches ctrl+c event
    process.on( 'SIGINT', () => exitHandler( { exit: true } ) );

    // catches "kill pid" (for example: nodemon restart)
    process.on( 'SIGUSR1', () => exitHandler( { exit: true } ) );
    process.on( 'SIGUSR2', () => exitHandler( { exit: true } ) );

    // catches uncaught exceptions
    process.on( 'uncaughtException', e => exitHandler( { arg: e, exit: true } ) );

    fs.watch( '..' + path.sep, { recursive: true }, ( eventType, filename ) => {

      const changeDetectedTime = Date.now();
      const filePath = Transpiler.forwardSlashify( '..' + path.sep + filename );

      // We observed a null filename on Windows for an unknown reason.
      if ( filename === null || this.isPathIgnored( filePath ) ) {
        return;
      }

      // Invalidate cache when any relevant file has changed.
      CacheLayer.updateLastChangedTimestamp();

      const pathExists = fs.existsSync( filePath );

      if ( !pathExists ) {
        const targetPath = Transpiler.getTargetPath( filePath );
        if ( fs.existsSync( targetPath ) && fs.lstatSync( targetPath ).isFile() ) {
          fs.unlinkSync( targetPath );

          delete this.status[ filePath ];
          this.saveCache();
          const now = Date.now();
          const reason = ' (deleted)';

          !this.silent && console.log( `${new Date( now ).toLocaleTimeString()}, ${( now - changeDetectedTime )} ms: ${filePath}${reason}` );
        }

        return;
      }

      if ( filePath.endsWith( 'perennial-alias/data/active-repos' ) ) {
        const newActiveRepos = getActiveRepos();
        !this.silent && console.log( 'reloaded active repos' );
        const newRepos = newActiveRepos.filter( repo => !this.activeRepos.includes( repo ) );

        // Run an initial scan on newly added repos
        newRepos.forEach( repo => {
          !this.silent && console.log( 'New repo detected in active-repos, transpiling: ' + repo );
          this.transpileRepo( repo );
        } );
        this.activeRepos = newActiveRepos;
      }
      else {
        const terms = filename.split( path.sep );
        if ( ( this.activeRepos.includes( terms[ 0 ] ) || this.repos.includes( terms[ 0 ] ) )
             && subdirs.includes( terms[ 1 ] ) && pathExists ) {
          this.visitFile( filePath );
        }
      }
    } );
  }
}

module.exports = Transpiler;