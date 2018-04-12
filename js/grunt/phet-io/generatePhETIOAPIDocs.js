// Copyright 2017, University of Colorado Boulder

/**
 * This file generates a file that holds all of the API information for the phet-io sim that is being built.
 * The output file will hold:
 * type documentation (common code and the specific sim)
 * instance documentation (a list of tandems and their types)
 * doc on simIFrameClient.launchSim() and its options
 * query parameter information, (phet and phet-io)
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

// modules
const getSimDocumentationFromWrapper = require( './getSimDocumentationFromWrapper' );

// constants
const DOCUMENTATION_FILENAME = 'phet-io-documentation.html';

const grunt = require( 'grunt' );

// TODO: doc
module.exports = function( repo, done ) {
  grunt.log.debug( 'Generating PhET-iO documentation' );

  getSimDocumentationFromWrapper( repo, function( html ) {

    // Write the new documentation to html
    grunt.file.write( '../' + repo + '/build/docs/' + DOCUMENTATION_FILENAME, html );
    grunt.log.debug( 'Wrote PhET-iO documentation file.' );
    done();
  } );
};

