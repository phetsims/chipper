// Copyright 2021, University of Colorado Boulder

/**
 * Compare macro APIs (files that contain 1+ APIs).
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

const _ = require( 'lodash' ); // eslint-disable-line
const compareAPIs = require( './compareAPIs' );

/**
 * @param {Object} macroAPI1
 * @param {Object} macroAPI2
 * @returns {{formatted: string, problems: {}}} discovered problems, if any
 */
module.exports = ( macroAPI1, macroAPI2 ) => {
  const problems = {};

  const repos1 = Object.keys( macroAPI1 );
  const repos2 = Object.keys( macroAPI2 );
  repos1.forEach( repo => {

    if ( !repos2.includes( repo ) ) {
      problems[ repo ] = [ 'Repo is missing in second macro API: ' + repo ];
    }
    else {
      problems[ repo ] = compareAPIs( macroAPI1[ repo ], macroAPI2[ repo ], _ );
    }
  } );

  let formatted = '';
  let problemCount = 0;
  const problemRepos = repos1.sort();
  problemRepos.forEach( repo => {
    problemCount += problems[ repo ].length;
    formatted += repo + '\n';
    problems[ repo ].forEach( problem => {
      formatted += `  ${problem}\n`;
    } );
    formatted += '\n';
  } );

  const jsondiffpatch = require( 'jsondiffpatch' ).create( {} );
  const delta = jsondiffpatch.diff( macroAPI1, macroAPI2 );
  return { problemCount: problemCount, problems: problems, formatted: formatted, delta: delta };
};