// Copyright 2013-2024, University of Colorado Boulder

/**
 * Grunt configuration file for PhET projects. In general when possible, modules are imported lazily in their task
 * declaration to save on overall load time of this file. The pattern is to require all modules needed at the top of the
 * grunt task registration. If a module is used in multiple tasks, it is best to lazily require in each
 * task.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const assert = require( 'assert' );
require( './checkNodeVersion' );
const child_process = require( 'child_process' );
const fs = require( 'fs' );
const path = require( 'path' );
const getDocumentationForTask = require( './getDocumentationForTask' );

const isWindows = /^win/.test( process.platform );

// Allow other Gruntfiles to potentially handle exiting and errors differently
if ( !global.processEventOptOut ) {

  // See https://medium.com/@dtinth/making-unhandled-promise-rejections-crash-the-node-js-process-ffc27cfcc9dd for how
  // to get unhandled promise rejections to fail out the node process.
  // Relevant for https://github.com/phetsims/wave-interference/issues/491
  process.on( 'unhandledRejection', up => { throw up; } );

  // Exit on Ctrl + C case
  process.on( 'SIGINT', () => {
    console.log( '\n\nCaught interrupt signal, exiting' );
    process.exit();
  } );
}

module.exports = function( grunt ) {
  const packageObject = grunt.file.readJSON( 'package.json' );

  const repo = grunt.option( 'repo' ) || packageObject.name;
  assert( typeof repo === 'string' && /^[a-z]+(-[a-z]+)*$/u.test( repo ), 'repo name should be composed of lower-case characters, optionally with dashes used as separators' );

  function execTask( taskFilename ) {
    const command = `${path.join( '..', 'chipper', 'node_modules', '.bin', 'tsx' )}${isWindows ? '.cmd' : ''}`;

    return () => {
      spawn( command, [ `../chipper/js/grunt/tasks/${taskFilename}`, ...process.argv.slice( 2 ) ], process.cwd(), false );
    };
  }

  grunt.registerTask( 'default', 'Builds the repository', [
    ...( grunt.option( 'lint' ) === false ? [] : [ 'lint-all' ] ),
    ...( grunt.option( 'report-media' ) === false ? [] : [ 'report-media' ] ),
    'clean',
    'build'
  ] );

  grunt.registerTask( 'build-for-server', 'meant for use by build-server only',
    [ 'build' ]
  );

  // Load each file from tasks/ and register it as a task
  fs.readdirSync( __dirname + '/tasks' ).forEach( file => {
    if ( file.endsWith( '.js' ) || file.endsWith( '.ts' ) ) {
      const taskName = file.substring( 0, file.lastIndexOf( '.' ) );

      const tsExists = fs.existsSync( `../chipper/js/grunt/tasks/${taskName}.ts` );
      const jsExists = fs.existsSync( `../chipper/js/grunt/tasks/${taskName}.js` );

      if ( tsExists && jsExists ) {
        throw new Error( `Both TypeScript and JavaScript versions of the task ${taskName} exist. Please remove one of them.` );
      }
      else {
        grunt.registerTask( taskName, getDocumentationForTask( file ), execTask( file ) );
      }
    }
  } );

  /**
   * Creates grunt tasks that effectively get forwarded to perennial. It will execute a grunt process running from
   * perennial's directory with the same options (but with --repo={{REPO}} added, so that perennial is aware of what
   * repository is the target).
   *
   * @param {string} task - The name of the task
   */
  function forwardToPerennialGrunt( task ) {
    grunt.registerTask( task, 'Run grunt --help in perennial to see documentation', () => {
      grunt.log.writeln( '(Forwarding task to perennial)' );
      const args = [ `--repo=${repo}`, ...process.argv.slice( 2 ) ];
      spawn( isWindows ? 'grunt.cmd' : 'grunt', args, '../perennial', true );
    } );
  }

  /**
   * Spawns a child process to run a command with the specified arguments.
   *
   * @param {string} command - The command to run.
   * @param {string[]} args - The arguments to pass to the command.
   * @param {string} cwd - The current working directory for the child process.
   * @param {boolean} [log=false] - Whether to log the command and arguments.
   */
  function spawn( command, args, cwd, log = false ) {
    const done = grunt.task.current.async();
    const argsString = args.map( arg => `"${arg}"` ).join( ' ' );
    const spawned = child_process.spawn( command, args, {
      cwd: cwd,
      shell: isWindows // shell is required for a NodeJS security update, see https://github.com/phetsims/perennial/issues/359
    } );
    log && grunt.log.debug( `running grunt ${argsString} in ../${repo}` );

    spawned.stderr.on( 'data', data => grunt.log.error( data.toString() ) );
    spawned.stdout.on( 'data', data => grunt.log.write( data.toString() ) );
    process.stdin.pipe( spawned.stdin );

    spawned.on( 'close', code => {
      if ( code !== 0 ) {
        throw new Error( `spawn: ${command} ${argsString} failed with code ${code}` );
      }
      else {
        done();
      }
    } );
  }

  [
    'checkout-shas',
    'checkout-target',
    'checkout-release',
    'checkout-main',
    'checkout-main-all',
    'create-one-off',
    'sha-check',
    'sim-list',
    'npm-update',
    'create-release',
    'cherry-pick',
    'wrapper',
    'dev',
    'one-off',
    'rc',
    'production',
    'prototype',
    'create-sim',
    'insert-require-statement',
    'lint-everything',
    'generate-data',
    'pdom-comparison',
    'release-branch-list'
  ].forEach( forwardToPerennialGrunt );
};