// Copyright 2017, University of Colorado Boulder

(function() {
  'use strict';
  var fs = require( 'fs' );


  var phetQueryParamsLocation = '../../../chipper/js/initialize-globals.js';
  var initGlobalsText = fs.readFileSync( phetQueryParamsLocation ).toString();
  var schemaIndex = initGlobalsText.indexOf( 'QUERY_PARAMETERS_SCHEMA = ' );
  var objectStart = schemaIndex + initGlobalsText.substring( schemaIndex ).indexOf( '{' );
  var objectEnd = schemaIndex + initGlobalsText.substring( schemaIndex ).indexOf( '};' ) + 1;


  var phetQueryParameters = initGlobalsText.substring( objectStart, objectEnd );


  var phetioQueryParamsLocation = '../phetio-query-parameters.js';
  var phetioParametersText = fs.readFileSync( phetioQueryParamsLocation ).toString();
  var phetioSchemaIndex = phetioParametersText.indexOf( 'QUERY_PARAMETERS_SCHEMA = ' );
  objectStart = phetioSchemaIndex + phetioParametersText.substring( phetioSchemaIndex ).indexOf( '{' );
  objectEnd = phetioSchemaIndex + phetioParametersText.substring( phetioSchemaIndex ).indexOf( '};' ) + 1;


  var phetioQueryParameters = phetioParametersText.substring( objectStart, objectEnd );



  var documentationFilename = 'phetioDocumentation';
  var phetioDocumentationTemplateText = fs.readFileSync( documentationFilename + '_template.html').toString();


  phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{PHET_QUERY_PARAMETERS}}', phetQueryParameters);
  phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{PHETIO_QUERY_PARAMETERS}}', phetioQueryParameters);

  fs.writeFileSync( documentationFilename + '.html', phetioDocumentationTemplateText);
})();