// Copyright 2021, University of Colorado Boulder

/**
 * Compare phet-io APIs for two versions of the same sim. This function treats the first api as the "ground truth"
 * and compares the second api to see if it has any breaking changes against the first api. This function returns a
 * list of "problems".
 *
 * This file runs in node (command line API comparison), in the diff wrapper (client-facing API comparison) and
 * in simulations in phetioEngine when ?ea&phetioCompareAPI is specified (for CT).
 *
 * Note that even though it is a preload, it uses a different global/namespacing pattern than phet-io-initialize-globals.js
 * in order to simplify usage in all these sites.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

/**
 * Copied from PhetioIDUtils, see https://github.com/phetsims/tandem/issues/231
 * @param {string} phetioID
 * @returns {null|string}
 */
function getParentID( phetioID ) {
  const indexOfLastSeparator = phetioID.lastIndexOf( '.' );
  return indexOfLastSeparator === -1 ? null : phetioID.substring( 0, indexOfLastSeparator );
}

/**
 * Compare two APIs for breaking or design changes.
 *
 * NOTE: Named with an underscore to avoid automatically defining `window.phetioCompareAPIs` as a global
 *
 * @param {Object} referenceAPI - the "ground truth" or reference API
 * @param {Object} proposedAPI - the proposed API for comparison with referenceAPI
 * @param _ - lodash, so this can be used from different contexts.
 * @param {Object} [options]
 * @returns {{breakingProblems:string[], designedProblems:string[], newAPI:Object}}
 */
const _phetioCompareAPIs = ( referenceAPI, proposedAPI, _, options ) => {

  options = _.merge( {
    compareDesignedAPIChanges: true,
    compareBreakingAPIChanges: true
  }, options );

  const isPhetioDesigned = ( api, phetioID ) => {
    return phetioID && // base case to prevent going beyond the root
           ( ( api.phetioElements[ phetioID ] && api.phetioElements[ phetioID ].phetioDesigned ) ||
             isPhetioDesigned( api, getParentID( phetioID ) ) );
  };

  const breakingProblems = [];
  const designedProblems = [];

  const newReferenceAPI = _.cloneDeep( referenceAPI );

  const appendProblem = ( problemString, isDesignedProblem = false ) => {
    if ( isDesignedProblem && options.compareDesignedAPIChanges ) {
      designedProblems.push( problemString );
    }
    else if ( !isDesignedProblem && options.compareBreakingAPIChanges ) {
      breakingProblems.push( problemString );
    }
  };

  const referencePhetioIDs = Object.keys( referenceAPI.phetioElements );
  const proposedPhetioIDs = Object.keys( proposedAPI.phetioElements );
  if ( !_.isEqual( referencePhetioIDs, proposedPhetioIDs ) ) {
    const missingFromProposed = referencePhetioIDs.filter( e => !proposedPhetioIDs.includes( e ) );
    missingFromProposed.forEach( missingPhetioID => {
      appendProblem( `PhET-iO Element missing: ${missingPhetioID}`, false );

      if ( isPhetioDesigned( referenceAPI, missingPhetioID ) ) {
        appendProblem( `PhET-iO Element missing: ${missingPhetioID}`, true );
      }

      delete newReferenceAPI.phetioElements[ missingPhetioID ];
    } );
  }
  referencePhetioIDs.forEach( phetioID => {
    if ( proposedPhetioIDs.includes( phetioID ) ) {

      /**
       * Push any problems that may exist for the provided metadataKey.
       * @param {string} metadataKey - See PhetioObject.getMetadata()
       * @param {boolean} isDesignedChange - if the difference is from a design change, and not from a breaking change test
       * @param {*} [invalidProposedValue] - an optional new value that would signify a breaking change. Any other value would be acceptable.
       */
      const reportDifferences = ( metadataKey, isDesignedChange = false, invalidProposedValue ) => {
        const referenceValue = referenceAPI.phetioElements[ phetioID ][ metadataKey ];
        const proposedValue = proposedAPI.phetioElements[ phetioID ][ metadataKey ];
        if ( referenceValue !== proposedValue ) {
          if ( invalidProposedValue === undefined || isDesignedChange ) {
            appendProblem( `${phetioID}.${metadataKey} changed from ${referenceValue} to ${proposedValue}`, isDesignedChange );
            newReferenceAPI.phetioElements[ phetioID ][ metadataKey ] = proposedValue;
          }
          else if ( !isDesignedChange ) {
            if ( proposedValue === invalidProposedValue ) {
              appendProblem( `${phetioID}.${metadataKey} changed from ${referenceValue} to ${proposedValue}` );
              newReferenceAPI.phetioElements[ phetioID ][ metadataKey ] = proposedValue;
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
      reportDifferences( 'phetioState', false, false ); // Only report if something became non-stateful
      reportDifferences( 'phetioReadOnly', false, true ); // Only need to report if something became readOnly

      // The following metadata keys are non-breaking:
      // 'phetioDocumentation'
      // 'phetioFeatured'
      // 'phetioStudioControl'
      // 'phetioHighFrequency', non-breaking, assuming clients with data have the full data stream

      if ( isPhetioDesigned( referenceAPI, phetioID ) ) {
        Object.keys( referenceAPI.phetioElements[ phetioID ] ).forEach( metadataKey => {
          reportDifferences( metadataKey, true );
        } );
      }
    }
  } );

  // Check for: missing IO Types, missing methods, or differing parameter types or return types
  for ( const typeName in referenceAPI.phetioTypes ) {
    if ( referenceAPI.phetioTypes.hasOwnProperty( typeName ) ) {

      // make sure we have the desired type
      if ( !proposedAPI.phetioTypes.hasOwnProperty( typeName ) ) {
        appendProblem( `Type missing: ${typeName}` );
        delete newReferenceAPI.phetioTypes[ typeName ];
      }
      else {
        const referenceType = referenceAPI.phetioTypes[ typeName ];
        const proposedType = proposedAPI.phetioTypes[ typeName ];
        const newReferenceType = newReferenceAPI.phetioTypes[ typeName ];

        // make sure we have all of the methods
        const referenceMethods = referenceType.methods;
        const proposedMethods = proposedType.methods;
        for ( const referenceMethod in referenceMethods ) {
          if ( referenceMethods.hasOwnProperty( referenceMethod ) ) {
            if ( !proposedMethods.hasOwnProperty( referenceMethod ) ) {
              appendProblem( `Method missing, type=${typeName}, method=${referenceMethod}` );
              delete newReferenceType.methods[ referenceMethod ];
            }
            else {

              // check parameter types (exact match)
              const referenceParams = referenceMethods[ referenceMethod ].parameterTypes;
              const proposedParams = proposedMethods[ referenceMethod ].parameterTypes;

              if ( referenceParams.join( ',' ) !== proposedParams.join( ',' ) ) {
                appendProblem( `${typeName}.${referenceMethod} has different parameter types: ${referenceParams.join( ', ' )} => ${proposedParams.join( ', ' )}` );
                newReferenceType.methods[ referenceMethod ].parameterTypes = _.clone( proposedParams );
              }

              const referenceReturnType = referenceMethods[ referenceMethod ].returnType;
              const proposedReturnType = proposedMethods[ referenceMethod ].returnType;
              if ( referenceReturnType !== proposedReturnType ) {
                appendProblem( `${typeName}.${referenceMethod} has a different return type ${referenceReturnType} => ${proposedReturnType}` );
                newReferenceType.methods[ referenceMethod ].returnType = proposedReturnType;
              }
            }
          }
        }

        // make sure we have all of the events (OK to add more)
        const referenceEvents = referenceType.events;
        const proposedEvents = proposedType.events;
        referenceEvents.forEach( event => {
          if ( !proposedEvents.includes( event ) ) {
            appendProblem( `${typeName} is missing event: ${event}` );
            newReferenceType.events = _.clone( proposedEvents );
          }
        } );

        // make sure we have matching supertype names
        const referenceSupertypeName = referenceType.supertype;
        const proposedSupertypeName = proposedType.supertype;
        if ( referenceSupertypeName !== proposedSupertypeName ) {
          appendProblem( `${typeName} supertype changed from ${referenceSupertypeName} to ${proposedSupertypeName}. This may or may not 
          be a breaking change, but we are reporting it just in case.` );
          newReferenceType.supertype = proposedSupertypeName;
        }

        // make sure we have matching parameter types
        const referenceParameterTypes = referenceType.parameterTypes;
        const proposedParameterTypes = proposedType.parameterTypes;
        if ( !_.isEqual( referenceParameterTypes, proposedParameterTypes ) ) {
          appendProblem( `${typeName} parameter types changed from ${referenceParameterTypes.join( ', ' )} to ${proposedParameterTypes.join( ', ' )}. This may or may not 
          be a breaking change, but we are reporting it just in case.` );
          newReferenceType.parameterTypes = _.clone( proposedParameterTypes );
        }

        // make sure we have matching metadata keys
        const referenceMetadataKeys = referenceType.metadataKeys;
        const proposedMetadataKeys = proposedType.metadataKeys;
        if ( !_.isEqual( referenceMetadataKeys, proposedMetadataKeys ) ) {
          appendProblem( `${typeName} metadata keys changed from ${referenceMetadataKeys.join( ', ' )} to ${proposedMetadataKeys.join( ', ' )}. This may or may not 
          be a breaking change, but we are reporting it just in case.` );
          newReferenceType.metadataKeys = _.clone( proposedMetadataKeys );
        }
      }
    }
  }

  return {
    newAPI: newReferenceAPI,
    breakingProblems: breakingProblems,
    designedProblems: designedProblems
  };
};

if ( typeof window === 'undefined' ) {

  // running in node
  module.exports = _phetioCompareAPIs;
}
else {

  window.phetio = window.phetio || {};
  window.phetio.phetioCompareAPIs = _phetioCompareAPIs;
}