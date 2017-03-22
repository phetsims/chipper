// Copyright 2017, University of Colorado Boulder

/* eslint-env node */
'use strict';

// modules
var fs = require( 'fs' );
var createTypeDocumentation = require( './createTypeDocumentation' );


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

var documentationFilename = 'phetioDocumentation';
var phetioDocumentationTemplateText = fs.readFileSync( documentationFilename + '_template.html' ).toString();


// Add the phet query parameters to the template
var phetQueryParameters = getQueryParameters( '../../../chipper/js/initialize-globals.js', 'QUERY_PARAMETERS_SCHEMA = ' );
phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{PHET_QUERY_PARAMETERS}}', phetQueryParameters );

// Add the phet-io query parameters to the template
var phetioQueryParameters = getQueryParameters( '../phetio-query-parameters.js', 'QUERY_PARAMETERS_SCHEMA = ' );
phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{PHETIO_QUERY_PARAMETERS}}', phetioQueryParameters );

var commonCodeTypes = createTypeDocumentation.getCommonCodeTypeDocs();
phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{COMMON_TYPE_DOCUMENTATION}}', commonCodeTypes);


var simSpecificTypes = createTypeDocumentation.getSimSpecificTypeDocs( 'build-an-atom', 'Build An Atom', 'BUILD_AN_ATOM' );
phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{SIM_TYPE_DOCUMENTATION}}', simSpecificTypes );


// Write the new documentation to html
fs.writeFileSync( documentationFilename + '.html', phetioDocumentationTemplateText );


