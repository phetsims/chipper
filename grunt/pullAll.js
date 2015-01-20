//  Copyright 2002-2014, University of Colorado Boulder

var assert = require( 'assert' );
var child_process = require( 'child_process' );
var fs = require( 'fs' );

/**
 * pulls all repos in parallel, see #58
 *
 * @param grunt
 * @param projectName
 */
module.exports = function( grunt, projectName ) {
  'use strict';

  var files = fs.readdirSync( '../' );
  var gitRoots = [];
  for ( var i = 0; i < files.length; i++ ) {
    var file = files[ i ];
    if ( fs.statSync( '../' + file ).isDirectory() ) {
      console.log( file );
      var gitPath = '../' + file + '/.git';
      if ( fs.existsSync( gitPath ) ) {
        // Do something
        gitRoots.push( '../' + file );
      }
    }
  }
  console.log( gitRoots );
  var done = grunt.task.current.async();
  var numPulled = 0;
  for ( i = 0; i < gitRoots.length; i++ ) {
    var gitRoot = gitRoots[ i ];
    var command = 'git pull';
    (function( gitRoot ) {
      child_process.exec( command, { cwd: gitRoot }, function( error1, stdout1, stderr1 ) {
        console.log( 'Finished checkout in ' + gitRoot );
        if ( stdout1 && stdout1.length > 0 ) {
          console.log( stdout1 );
        }
        if ( stderr1 && stderr1.length > 0 ) {
          console.log( stderr1 );
        }
        if ( error1 && error1.length > 0 ) {
          console.log( error1 );
        }
        numPulled = numPulled + 1;
        if ( numPulled === gitRoots.length ) {
          done();
        }
      } );
    })( gitRoot );
  }
};