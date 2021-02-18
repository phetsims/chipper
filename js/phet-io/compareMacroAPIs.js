// Copyright 2021, University of Colorado Boulder

/**
 * Compare macro APIs (files that contain 1+ APIs).  TODO: https://github.com/phetsims/phet-io/issues/1733, see
 * TODO: compareAPIs.js and make sure this can run in all appropriate contexts, not just node
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
      problems[ repo ] = [ { message: 'Repo is missing in second macro API' } ];
    }
    else {
      problems[ repo ] = compareAPIs( macroAPI1[ repo ], macroAPI2[ repo ] );
    }
  } );

  let formatted = '';
  let problemCount = 0;
  const problemRepos = repos1.sort();
  problemRepos.forEach( repo => {
    problemCount += problems[ repo ].length;
    formatted += repo + '\n';
    problems[ repo ].forEach( problem => {
      formatted += `  ${problem.message}\n`;
    } );
    formatted += '\n';
  } );
  return { problemCount: problemCount, problems: problems, formatted: formatted };
};