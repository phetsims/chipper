// Copyright 2013-2024, University of Colorado Boulder

/**
 * Grunt configuration file for PhET projects. In general when possible, modules are imported lazily in their task
 * declaration to save on overall load time of this file. The pattern is to require all modules needed at the top of the
 * grunt task registration. If a module is used in multiple tasks, it is best to lazily require in each
 * task.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

const assert = require( 'assert' );
require( './checkNodeVersion.js' );
const registerTasks = require( '../../../perennial-alias/js/grunt/util/registerTasks.js' );
const gruntSpawn = require( '../../../perennial-alias/js/grunt/util/gruntSpawn.js' );
const _ = require( 'lodash' );

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

  registerTasks( grunt, __dirname + '/tasks/' );

  /**
   * Creates grunt tasks that effectively get forwarded to perennial. It will execute a grunt process running from
   * perennial's directory with the same options (but with --repo={{REPO}} added, so that perennial is aware of what
   * repository is the target).
   *
   * @param {string} forwardingRepo
   * @param {string} task - The name of the task
   */
  function forwardToRepo( forwardingRepo, task ) {
    grunt.registerTask( task, `Run grunt --help in ${forwardingRepo} to see documentation`, () => {
      grunt.log.writeln( `(Forwarding task to ${forwardingRepo})` );
      const currentArgs = process.argv.slice( 2 ); // Remove the "node grunt" from the command.
      const args = [ ...currentArgs ];

      // Don't duplicate repo arg
      !_.some( process.argv, arg => arg.startsWith( '--repo=' ) ) && args.push( `--repo=${repo}` );
      const isWindows = /^win/.test( process.platform );
      gruntSpawn( grunt, isWindows ? 'grunt.cmd' : 'grunt', args, `../${forwardingRepo}`, argsString => {
        grunt.log.debug( `running grunt ${argsString} in ../${repo}` );
      } );
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
    'dev',
    'one-off',
    'rc',
    'production',
    'prototype',
    'create-sim',
    'generate-data',
    'release-branch-list'
  ].forEach( task => forwardToRepo( 'perennial', task ) );

  // Forward these to perennial-alias because they are used for building sims, and should version with sims (like chipper
  // does).
  [
    'check',
    'lint',
    'lint-everything'
  ].forEach( task => forwardToRepo( 'perennial-alias', task ) );
};