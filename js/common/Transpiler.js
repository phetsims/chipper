// Copyright 2021, University of Colorado Boulder

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
const core = require( '@babel/core' );
const assert = require( 'assert' );

// constants
if ( path.sep === undefined ) {
  throw new Error( 'path.sep is undefined' );
}
const PATH_SEP = path.sep;

// Cache status is stored in chipper/dist so if you wipe chipper/dist you also wipe the cache
const statusPath = '../chipper/dist/js-cache-status.json';
const root = '../';

// Directories in a sim repo that may contain things for transpilation
// This is used for a top-down search in the initial transpilation and for filtering relevant files in the watch process
const subdirs = [ 'js', 'images', 'mipmaps', 'sounds' ];

class Transpiler {
  constructor( options ) {

    options = options || {
      clean: false, verbose: false
    };

    // @private
    this.verbose = options.verbose;

    // Track the status of each repo. Key= repo, value=md5 hash of contents
    this.status = {};

    // Make sure a directory exists for the cached status file
    fs.mkdirSync( path.dirname( statusPath ), { recursive: true } );

    if ( options.clean ) {
      console.log( 'cleaning...' );
      fs.writeFileSync( statusPath, JSON.stringify( {}, null, 2 ) );
    }

    // Load cached status
    try {
      this.status = JSON.parse( fs.readFileSync( statusPath, 'utf-8' ) );
    }
    catch( e ) {
      console.log( 'couldnt parse status cache, making a clean one' );
      this.status = {};
      fs.writeFileSync( statusPath, JSON.stringify( this.status, null, 2 ) );
    }

    // Use the same implementation as getRepoList, but we need to read from perennial-alias since chipper should not
    // depend on perennial.
    this.activeRepos = fs.readFileSync( '../perennial-alias/data/active-repos', 'utf8' ).trim().split( '\n' ).map( sim => sim.trim() );
  }

  /**
   * Returns the path in chipper/dist that corresponds to a source file.
   * @param filename
   * @returns {string}
   * @public
   */
  static getTargetPath( filename ) {
    const relativePath = path.relative( root, filename );
    const targetPath = path.join( root, 'chipper', 'dist', 'js', ...relativePath.split( PATH_SEP ) ).split( '.ts' ).join( '.js' );
    return targetPath;
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
      presets: [ '../chipper/node_modules/@babel/preset-typescript' ], sourceMaps: 'inline'
    } );

    fs.mkdirSync( path.dirname( targetPath ), { recursive: true } );
    fs.writeFileSync( targetPath, x.code );
  }

  // @public
  static modifiedTimeMilliseconds( file ) {
    return fs.statSync( file ).mtime.getTime();
  }

  /**
   * For *.ts and *.js files, checks if they have changed file contents since last transpile.  If so, the
   * file is transpiled.
   * @param {string} path
   * @private
   */
  visitFile( path ) {
    if ( path.endsWith( '.js' ) || path.endsWith( '.ts' ) ) {
      const changeDetectedTime = Date.now();
      const text = fs.readFileSync( path, 'utf-8' );
      const hash = crypto.createHash( 'md5' ).update( text ).digest( 'hex' );

      // If the file has changed, transpile and update the cache.  We have to choose on the spectrum between safety
      // and performance.  In order to maintain high performance with a low error rate, we only write the transpiled file
      // if (a) the cache is out of date (b) there is no target file at all or (c) if the target file has been modified.
      const targetPath = Transpiler.getTargetPath( path );

      if ( !this.status[ path ] || this.status[ path ].sourceMD5 !== hash || !fs.existsSync( targetPath ) || this.status[ path ].targetMilliseconds !== Transpiler.modifiedTimeMilliseconds( targetPath ) ) {
        try {
          let reason = '';
          if ( this.verbose ) {
            reason = ( !this.status[ path ] ) ? ' (not cached)' : ( this.status[ path ].sourceMD5 !== hash ) ? ' (changed)' : ( !fs.existsSync( targetPath ) ) ? ' (no target)' : ( this.status[ path ].targetMilliseconds !== Transpiler.modifiedTimeMilliseconds( targetPath ) ) ? ' (target modified)' : '???';
          }
          Transpiler.transpileFunction( path, targetPath, text );

          this.status[ path ] = {
            sourceMD5: hash, targetMilliseconds: Transpiler.modifiedTimeMilliseconds( targetPath )
          };
          fs.writeFileSync( statusPath, JSON.stringify( this.status, null, 2 ) );
          const now = Date.now();
          const nowTimeString = new Date( now ).toLocaleTimeString();

          console.log( `${nowTimeString}, ${( now - changeDetectedTime )} ms: ${path}${reason}` );
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
        const child = path.join( dir, file );
        if ( fs.lstatSync( child ).isDirectory() ) {
          this.visitDirectory( child );
        }
        else {
          this.visitFile( child );
        }
      } );
    }
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
    subdirs.forEach( subdir => this.visitDirectory( path.join( '..', repo, subdir ) ) );
    if ( repo === 'sherpa' ) {

      // Our sims load this as a module rather than a preload, so we must transpile it
      this.visitFile( path.join( '..', repo, 'lib', 'game-up-camera-1.0.0.js' ) );
    }
    else if ( repo === 'brand' ) {
      this.visitDirectory( path.join( '..', repo, 'phet' ) );
      this.visitDirectory( path.join( '..', repo, 'phet-io' ) );
      this.visitDirectory( path.join( '..', repo, 'adapted-from-phet' ) );
    }
  }

  // @public
  transpileAll() {
    this.transpileRepos( this.activeRepos );
  }

  // @public
  watch() {
    fs.watch( '../', { recursive: true }, ( eventType, filename ) => {

      const changeDetectedTime = Date.now();

      const path = '../' + filename;
      const pathExists = fs.existsSync( path );

      if ( !pathExists ) {
        const targetPath = Transpiler.getTargetPath( path );
        if ( fs.existsSync( targetPath ) ) {
          fs.unlinkSync( targetPath );

          delete this.status[ path ];
          fs.writeFileSync( statusPath, JSON.stringify( this.status, null, 2 ) );
          const now = Date.now();
          const reason = ' (deleted)';

          console.log( `${new Date( now ).toLocaleTimeString()}, ${( now - changeDetectedTime )} ms: ${path}${reason}` );
        }

        return;
      }
      if ( filename.includes( '/node_modules/' ) || filename.includes( '.git/' ) || filename.includes( 'chipper/dist/' ) || filename.includes( 'transpile/cache/status.json' ) ||

           // Temporary files sometimes saved by the IDE
           filename.endsWith( '~' ) ) {

        // ignore
      }
      else if ( filename === 'perennial/data/active-repos' ) {
        const newActiveRepos = fs.readFileSync( '../perennial/data/active-repos', 'utf-8' ).trim().split( '\n' );
        console.log( 'reloaded active repos' );
        const newRepos = newActiveRepos.filter( repo => !this.activeRepos.includes( repo ) );

        // Run an initial scan on newly added repos
        newRepos.forEach( repo => {
          console.log( 'New repo detected in active-repos, transpiling: ' + repo );
          this.transpileRepo( repo );
        } );
        this.activeRepos = newActiveRepos;
      }
      else {
        const terms = filename.split( PATH_SEP );
        if ( this.activeRepos.includes( terms[ 0 ] ) && subdirs.includes( terms[ 1 ] ) && pathExists ) {
          this.visitFile( path );
        }
      }
    } );
  }
}

module.exports = Transpiler;