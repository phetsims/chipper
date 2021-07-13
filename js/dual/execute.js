// Copyright 2021, University of Colorado Boulder

/**
 * Command execution wrapper (with common settings)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */


const child_process = require( 'child_process' );
const winston = require( 'winston' );
const _ = require( 'lodash' ); // eslint-disable-line
const assert = require( 'assert' );
const grunt = require( 'grunt' );

/**
 * Executes a command, with specific arguments and in a specific directory (cwd).
 * @public
 *
 * Resolves with the stdout: {string}
 * Rejects with { code: {number}, stdout: {string} } -- Happens if the exit code is non-zero.
 *
 * @param {string} cmd - The process to execute. Should be on the current path.
 * @param {Array.<string>} args - Array of arguments. No need to extra-quote things.
 * @param {string} cwd - The working directory where the process should be run from
 * @param {Object} [options]
 * @returns {Promise.<string>} - Stdout
 * @rejects {ExecuteError}
 */
module.exports = function( cmd, args, cwd, options ) {

  options = _.extend( { // eslint-disable-line

    // {'reject'|'resolve'} - whether errors should be rejected or resolved.  If errors are resolved, then an object
    //                      - of the form {code:number,stdout:string,stderr:string} is returned. 'resolve' allows usage
    //                      - in Promise.all without exiting on the 1st failure
    errors: 'reject'
  }, options );
  assert( options.errors === 'reject' || options.errors === 'resolve', 'Errors must reject or resolve' );

  class ExecuteError extends Error {
    /**
     * @param {string} cmd
     * @param {Array.<string>} args
     * @param {string} cwd
     * @param {string} stdout
     * @param {string} stderr
     * @param {number} code - exit code
     */
    constructor( cmd, args, cwd, stdout, stderr, code ) {
      super( `${cmd} ${args.join( ' ' )} in ${cwd} failed with exit code ${code}${stdout ? `\nstdout:\n${stdout}` : ''}${stderr ? `\nstderr:\n${stderr}` : ''}` );

      // @public
      this.cmd = cmd;
      this.args = args;
      this.cwd = cwd;
      this.stdout = stdout;
      this.stderr = stderr;
      this.code = code;
    }
  }

  return new Promise( ( resolve, reject ) => {

    let rejectedByError = false;

    let stdout = ''; // to be appended to
    let stderr = '';

    const process = child_process.spawn( cmd, args, {
      cwd: cwd
    } );

    process.on( 'error', error => {
      rejectedByError = true;

      if ( options.errors === 'resolve' ) {
        resolve( { code: 1, stdout: stdout, stderr: stderr, cwd: cwd, error: error } );
      }
      else {

        reject( new ExecuteError( cmd, args, cwd, stdout, stderr, -1 ) );
      }
    } );
    winston.debug( `Running ${cmd} ${args.join( ' ' )} from ${cwd}` );

    process.stderr.on( 'data', data => {
      stderr += data;
      grunt.log.debug( `stderr: ${data}` );
    } );
    process.stdout.on( 'data', data => {
      stdout += data;
      grunt.log.debug( `stdout: ${data}` );
    } );

    process.on( 'close', code => {
      winston.debug( `Command ${cmd} finished. Output is below.` );

      winston.debug( stderr && `stderr: ${stderr}` || 'stderr is empty.' );
      winston.debug( stdout && `stdout: ${stdout}` || 'stdout is empty.' );

      if ( !rejectedByError ) {
        if ( options.errors === 'resolve' ) {
          resolve( { code: code, stdout: stdout, stderr: stderr, cwd: cwd } );
        }
        else {
          if ( code !== 0 ) {
            reject( new ExecuteError( cmd, args, cwd, stdout, stderr, code ) );
          }
          else {
            resolve( stdout );
          }
        }
      }
    } );
  } );
};
