// Copyright 2017, University of Colorado Boulder

/* eslint-env node */
'use strict';

var fs = require( 'fs' );
var child_process = require( 'child_process' );
var execSync = child_process.execSync;

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


/**
 *
 * @param repoName
 * @returns {{branch: *, sha: *, repo: *}}
 */
function getGitInfo( repoName ) {

  var sha = execSync( 'git rev-parse HEAD', { cwd: '../../../' + repoName, env: process.env } ).toString();
  var branch = execSync( 'git rev-parse --abbrev-ref HEAD', {
    cwd: '../../../' + repoName,
    env: process.env
  } ).toString();

  return { branch: branch.replace( '\n', '' ), sha: sha.replace( '\n', '' ), repo: repoName };
}


var phetQueryParameters = getQueryParameters( '../../../chipper/js/initialize-globals.js', 'QUERY_PARAMETERS_SCHEMA = ' );
var phetioQueryParameters = getQueryParameters( '../phetio-query-parameters.js', 'QUERY_PARAMETERS_SCHEMA = ' );


var phetioGitInfo = getGitInfo( 'phet-io' );
var joistGitInfo = getGitInfo( 'joist' );
var chipperGitInfo = getGitInfo( 'chipper' );

var shaHTML = '';
[ phetioGitInfo, joistGitInfo, chipperGitInfo ].forEach( function( info ) {
  shaHTML += '<li>' + info.repo + ' on branch "' + info.branch + '" at sha + ' + info.sha + '</li><br>\n';
} );

// Replace the template strings with the api documentation
var documentationFilename = 'phetioDocumentation';
var phetioDocumentationTemplateText = fs.readFileSync( documentationFilename + '_template.html' ).toString();


phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{SHAS}}', shaHTML );
phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{PHET_QUERY_PARAMETERS}}', phetQueryParameters );
phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{PHETIO_QUERY_PARAMETERS}}', phetioQueryParameters );


// This is async, so we have to finish in a callback
createTypeDocumentation( function( typeDocumentation){
  phetioDocumentationTemplateText = phetioDocumentationTemplateText.replace( '{{TYPE_DOCUMENTATION}}', typeDocumentation);



// Write the new documentation to html
  fs.writeFileSync( documentationFilename + '.html', phetioDocumentationTemplateText );

});


