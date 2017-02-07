// Copyright 2017, University of Colorado Boulder

/* eslint-env node */
'use strict';

var fs = require( 'fs' );

/**
 * Returns the string of the query parameter schema that you are getting
 * @param filename
 * @param marker - the text to find the beginning of the query parameters
 * @returns {string} - query parameter string
 */
function getQueryParameters( filename, marker) {

  var initGlobalsText = fs.readFileSync( filename ).toString();
  var schemaIndex = initGlobalsText.indexOf( marker );
  var objectStart = schemaIndex + initGlobalsText.substring( schemaIndex ).indexOf( '{' );
  var objectEnd = schemaIndex + initGlobalsText.substring( schemaIndex ).indexOf( '};' ) + 1;

  return initGlobalsText.substring( objectStart, objectEnd );
}


var phetQueryParameters = getQueryParameters( '../../../chipper/js/initialize-globals.js', 'QUERY_PARAMETERS_SCHEMA = ');
var phetioQueryParameters = getQueryParameters( '../phetio-query-parameters.js', 'QUERY_PARAMETERS_SCHEMA = ');


// Replace the template strings with the api documentation
var documentationFilename = 'phetioDocumentation';
var phetioDocumentationTemplateText = fs.readFileSync( documentationFilename + '_template.html' ).toString();

phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{PHET_QUERY_PARAMETERS}}', phetQueryParameters );
phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{PHETIO_QUERY_PARAMETERS}}', phetioQueryParameters );


// Write the new documentation to html
fs.writeFileSync( documentationFilename + '.html', phetioDocumentationTemplateText );


