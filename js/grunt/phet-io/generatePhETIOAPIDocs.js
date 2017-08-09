// Copyright 2017, University of Colorado Boulder

/**
 * This file generates a file that holds all of the API information for the phet-io sim that is being built.
 * The output file will hold: query parameter information, type documentation (common code and the specific sim)
 * @author - Michael Kauzmann (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

// modules
var fs = require( 'fs' );
var ChipperStringUtils = require( '../../common/ChipperStringUtils' );
var child_process = require( 'child_process' );
var execSync = child_process.execSync;

// constants
var TYPE_DOCS_RUNNABLE = '../chipper/js/grunt/phet-io/createTypeDocumentation.js';

var DOCUMENTATION_PATH = '../chipper/templates/';
var DOCUMENTATION_FILENAME = 'phet-io-documentation.html';

/**
 * Returns the string of the query parameter schema that you are getting
 * @param filename
 * @param marker - the text to find the beginning of the query parameters
 * @returns {string} - query parameter string
 */
function getQueryParameters( filename, marker ) {

  var initGlobalsText = fs.readFileSync( filename ).toString();
  var schemaIndex = initGlobalsText.indexOf( marker );
  var objectStart = schemaIndex + initGlobalsText.substring( schemaIndex ).indexOf( '{' );
  var objectEnd = schemaIndex + initGlobalsText.substring( schemaIndex ).indexOf( '};' ) + 1;

  return initGlobalsText.substring( objectStart, objectEnd );
}

module.exports = function( grunt, buildConfig ) {

  var phetioDocumentationTemplateText = fs.readFileSync( DOCUMENTATION_PATH  + DOCUMENTATION_FILENAME ).toString();

// Add the phet query parameters to the template
  var phetQueryParameters = getQueryParameters( '../chipper/js/initialize-globals.js', 'QUERY_PARAMETERS_SCHEMA = ' );
  phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{PHET_QUERY_PARAMETERS}}', phetQueryParameters );

// Add the phet-io query parameters to the template
  var phetioQueryParameters = getQueryParameters( '../phet-io/js/phet-io-query-parameters.js', 'QUERY_PARAMETERS_SCHEMA = ' );
  phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{PHETIO_QUERY_PARAMETERS}}', phetioQueryParameters );

  var commonCodeTypes = execSync( 'node ' + TYPE_DOCS_RUNNABLE + ' --common' ).toString();
  phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{COMMON_TYPE_DOCUMENTATION}}', commonCodeTypes );

  var simSpecificTypes = execSync( 'node ' + TYPE_DOCS_RUNNABLE + ' --sim ' +
                                   buildConfig.name + ' "' + // repoName
                                   ChipperStringUtils.toTitle( buildConfig.name ) + '" ' +// formal display name
                                   buildConfig.requirejsNamespace // requirejs namespace in all caps
  ).toString();

  phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{SIM_TYPE_DOCUMENTATION}}', simSpecificTypes );

  // Write the new documentation to html
  grunt.file.write( 'build/docs/' + DOCUMENTATION_FILENAME, phetioDocumentationTemplateText );
};