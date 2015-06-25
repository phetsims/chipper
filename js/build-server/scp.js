// Copyright 2002-2015, University of Colorado Boulder

/**
 * SCP for build server
 *
 * @author Aaron Davis
 */

/* jslint node: true */
'use strict';

// modules
var scp = require( 'scp' );
var credentials = require( './credentials.json' );

module.exports.scp = function( file ) {
  var options = {
    file: file,
    user: credentials.username,
    host: 'rintintin.colorado.edu',
    port: '22',
    path: '~'
  };

  scp.send( options, function( err ) {
    if ( err ) {
      console.log( err );
    }
    else {
      console.log( 'File transferred.' );
    }
  } );
};

module.exports.scp( 'test.txt' );