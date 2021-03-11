// Copyright 2021, University of Colorado Boulder

/**
 * Compare phet-io APIs for two versions of the same sim. This function treats the first api as the "ground truth"
 * and compares the second api to see if it has any breaking changes against the first api. This function returns a
 * list of "problems".
 *
 * TODO: https://github.com/phetsims/phet-io/issues/1733, see
 * TODO: compareAPIs.js and make sure this can run in all appropriate contexts, not just node
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

const compareAPIs = ( api1, api2, _ ) => {
  const problems = [];
  const elements1 = Object.keys( api1.phetioElements );
  const elements2 = Object.keys( api2.phetioElements );
  if ( !_.isEqual( elements1, elements2 ) ) {
    const missingFrom2 = elements1.filter( e => !elements2.includes( e ) );
    missingFrom2.forEach( missing => problems.push( `PhET-iO Element missing: ${missing}` ) );
  }
  elements1.forEach( phetioID => {
    if ( elements2.includes( phetioID ) ) {

      /**
       * Push any problems that may exist for the provided metadataKey.
       * @param {string} metadataKey - See PhetioObject.getMetadata()
       * @param {*} [invalidNewValue] - an option new value that would signify a breaking change. Any other value would be acceptable.
       */
      const reportDifferences = ( metadataKey, invalidNewValue ) => {
        const oldValue = api1.phetioElements[ phetioID ][ metadataKey ];
        const newValue = api2.phetioElements[ phetioID ][ metadataKey ];
        if ( oldValue !== newValue ) {
          if ( invalidNewValue === undefined ) {
            problems.push( `${phetioID}.${metadataKey} changed from ${oldValue} to ${newValue}` );
          }
          else {

            if ( newValue === invalidNewValue ) {
              problems.push( `${phetioID}.${metadataKey} changed from ${oldValue} to ${newValue}` );
            }
            else {

              // value changed, but it was a widening API (adding something to state, or making something read/write)
            }
          }
        }
      };

      // appears in both, now check its metadata
      reportDifferences( 'phetioTypeName' );
      reportDifferences( 'phetioEventType' );
      reportDifferences( 'phetioPlayback' );
      reportDifferences( 'phetioDynamicElement' );
      reportDifferences( 'phetioIsArchetype' );
      reportDifferences( 'phetioArchetypePhetioID' );
      reportDifferences( 'phetioState', false ); // Only report if something became non-stateful
      reportDifferences( 'phetioReadOnly', true ); // Only need to report if something became readOnly

      // The following metadata keys are non-breaking:
      // 'phetioDocumentation'
      // 'phetioFeatured'
      // 'phetioStudioControl'
      // 'phetioHighFrequency', non-breaking, assuming clients with data have the full data stream
    }
  } );

  // Check for: missing IO Types, missing methods, or differing parameter types or return types
  for ( const typeName in api1.phetioTypes ) {
    if ( api1.phetioTypes.hasOwnProperty( typeName ) ) {

      // make sure we have the desired type
      if ( !api2.phetioTypes.hasOwnProperty( typeName ) ) {
        problems.push( 'Type missing: ' + typeName );
      }
      else {

        // make sure we have all of the methods
        const methods1 = api1.phetioTypes[ typeName ].methods;
        const methods2 = api2.phetioTypes[ typeName ].methods;
        for ( const method in methods1 ) {
          if ( methods1.hasOwnProperty( method ) ) {
            if ( !methods2.hasOwnProperty( method ) ) {
              problems.push( `Method missing, type=${typeName}, method=${method}` );
            }
            else {

              // check parameter types (exact match)
              const params1 = methods1[ method ].parameterTypes;
              const params2 = methods2[ method ].parameterTypes;

              if ( params1.join( ',' ) !== params2.join( ',' ) ) {
                problems.push( `${typeName}.${method} has different parameter types: ${params1.join( ', ' )} => ${params2.join( ', ' )}` );
              }

              const returnType1 = methods1[ method ].returnType;
              const returnType2 = methods2[ method ].returnType;
              if ( returnType1 !== returnType2 ) {
                problems.push( `${typeName}.${method} has a different return type ${returnType1} => ${returnType2}` );
              }
            }
          }
        }
      }
    }
  }

  return problems;
};

if ( typeof window === 'undefined' ) {
  module.exports = compareAPIs;
}
else {
  window.compareAPIs = compareAPIs;
}