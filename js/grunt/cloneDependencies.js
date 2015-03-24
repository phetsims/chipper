// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task clones the dependencies for a project (except for the project itself, chipper and sherpa).
 * See issue #56.
 *
 * @author Sam Reid
 * @author John Blanco
 */

var assert = require( 'assert' );
var child_process = require( 'child_process' );

/**
 * @param grunt the grunt instance
 * @param {string} repositoryName name field from package.json
 * @param {string[]} phetLibs from package.json
 */
module.exports = function( grunt, repositoryName, phetLibs ) {
  'use strict';

  console.log( 'cloning dependencies for', repositoryName );

  var dependencies = _.without( phetLibs, repositoryName, 'chipper', 'sherpa' );
  var numCloned = 0;
  var done = grunt.task.current.async();

  for ( var i = 0; i < dependencies.length; i++ ) {

    var dependency = dependencies[ i ];
    var command = 'git clone https://github.com/phetsims/' + dependency + '.git';
    console.log( 'executing:', command );

    child_process.exec( command, { cwd: '../' }, function( error1, stdout1, stderr1 ) {

      console.log( stdout1 );
      console.log( stderr1 );
      assert( !error1, "error in " + command );
      console.log( 'clone finished.' );

      numCloned++;
      if ( numCloned === dependencies.length ) {
        done();
      }
    } );
  }
};