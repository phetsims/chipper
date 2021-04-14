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
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

'use strict';

/**
 * @typedef API
 * @property {boolean} phetioFullAPI
 * @property {Object} phetioElements - phetioElements for version >=1.0 this will be a sparse, tree like structure with
 *                    metadata in key: `_metadata`. For version<1 this will be a flat list with phetioIDs as keys,
 *                    and values as metadata.
 * @property {Object} phetioTypes
 */

/**
 * See phetioEngine.js for where this is generated in master. Keep in mind that we support different versions, including
 * APIs that don't have a version attribute.
 * @typedef API_1_0
 * @extends API
 * @property {{major:number, minor:number}} version
 * @property {string} sim
 */


const METADATA_KEY_NAME = '_metadata';

/**
 * "up-convert" an API to be in the format of API version >=1.0. This generally is thought of as a "sparse, tree-like"
 * api.
 * @param {API} api
 * @param _
 * @returns {API} - In this version, phetioElements will be structured as a tree, but will have a verbose and complete
 *                  set of all metadata keys for each element. There will not be `metadataDefaults` in each type.
 */
const toStructuredTree = ( api, _ ) => {
  const sparseAPI = _.cloneDeep( api );

  // DUPLICATED with phetioEngine.js
  const sparseElements = {};
  Object.keys( api.phetioElements ).forEach( phetioID => {
    const entry = api.phetioElements[ phetioID ];

    const chain = phetioID.split( '.' ); // TODO: use PhETIOIDUtils separator, see https://github.com/phetsims/phet-io/issues/1753

    // Fill in each level
    let level = sparseElements;
    chain.forEach( componentName => {
      level[ componentName ] = level[ componentName ] || {};
      level = level[ componentName ];
    } );

    level[ METADATA_KEY_NAME ] = {};

    Object.keys( entry ).forEach( key => {

        // write all values without trying to factor out defaults
        level[ METADATA_KEY_NAME ][ key ] = entry[ key ];
      }
    );
  } );

  sparseAPI.phetioElements = sparseElements;
  return sparseAPI;
};

/**
 * @param {Object} phetioElement
 * @param {API} api
 * @param {Object} _ - lodash
 * @param {function|undefined} assert - optional assert
 * @returns {Object}
 */
const getMetadataValues = ( phetioElement, api, _, assert ) => {
  const typeName = phetioElement[ METADATA_KEY_NAME ].phetioTypeName || 'ObjectIO';

  if ( api.version ) {
    const defaults = getMetadataDefaults( typeName, api, _, assert );
    return _.merge( defaults, phetioElement[ METADATA_KEY_NAME ] );
  }
  else {

    // Dense version supplies all metadata values
    return phetioElement[ METADATA_KEY_NAME ];
  }
};

/**
 * @param {string} typeName
 * @param {API} api
 * @param {Object} _ - lodash
 * @param {function|undefined} assert - optional assert
 * @returns {Object} - defensive copy, non-mutating
 */
const getMetadataDefaults = ( typeName, api, _, assert ) => {
  const entry = api.phetioTypes[ typeName ];
  assert && assert( entry, `entry missing: ${typeName}` );
  if ( entry.supertype ) {
    return _.merge( getMetadataDefaults( entry.supertype, api, _ ), entry.metadataDefaults );
  }
  else {
    return _.merge( {}, entry.metadataDefaults );
  }
};

/**
 * @param {API} api
 * @returns {boolean} - whether or not the API is of type API_1_0
 */
const isOldAPIVersion = api => {
  return !api.hasOwnProperty( 'version' );
};

/**
 * Compare two APIs for breaking or design changes.
 *
 * NOTE: Named with an underscore to avoid automatically defining `window.phetioCompareAPIs` as a global
 *
 * @param {API_1_0} referenceAPI - the "ground truth" or reference API
 * @param {API} proposedAPI - the proposed API for comparison with referenceAPI
 * @param _ - lodash, so this can be used from different contexts.
 * @param {function|undefined} assert - so this can be used from different contexts
 * @param {Object} [options]
 * @returns {{breakingProblems:string[], designedProblems:string[], newAPI:Object}}
 */
const _phetioCompareAPIs = ( referenceAPI, proposedAPI, _, assert, options ) => {

  assert && assert( !isOldAPIVersion( referenceAPI ) && referenceAPI.version.major >= 1, 'referenceAPI must be versioned >= 1.0' );

  // If the proposed version predates 1.0, then bring it forward to the structured tree with metadata under `_metadata`.
  if ( isOldAPIVersion( proposedAPI ) ) {
    proposedAPI = toStructuredTree( proposedAPI, _ );
  }

  options = _.merge( {
    compareDesignedAPIChanges: true,
    compareBreakingAPIChanges: true
  }, options );

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

  /**
   * Visit one element along the APIs.
   * @param {string[]} trail - the path of tandem componentNames
   * @param {Object} reference - current value in the referenceAPI
   * @param {Object} proposed - current value in the proposedAPI
   * @param {Object} newReference - current value in the newReferenceAPI - mutated with changes
   * @param {boolean} isDesigned
   */
  const visit = ( trail, reference, proposed, newReference, isDesigned ) => {
    const phetioID = trail.join( '.' );

    // Detect an instrumented instance
    if ( reference.hasOwnProperty( METADATA_KEY_NAME ) ) {

      // Override isDesigned, if specified
      isDesigned = isDesigned || reference[ METADATA_KEY_NAME ].phetioDesigned;

      const referenceCompleteMetadata = getMetadataValues( reference, referenceAPI, _, assert );
      const proposedCompleteMetadata = getMetadataValues( proposed, proposedAPI, _, assert );
      /**
       * Push any problems that may exist for the provided metadataKey.
       * @param {string} metadataKey - See PhetioObject.getMetadata()
       * @param {boolean} isDesignedChange - if the difference is from a design change, and not from a breaking change test
       * @param {*} [invalidProposedValue] - an optional new value that would signify a breaking change. Any other value would be acceptable.
       */
      const reportDifferences = ( metadataKey, isDesignedChange = false, invalidProposedValue ) => {
        const referenceValue = referenceCompleteMetadata[ metadataKey ];
        const proposedValue = proposedCompleteMetadata[ metadataKey ];

        if ( referenceValue !== proposedValue ) {

          // if proposed API is older (no version specified), ignore phetioArchetypePhetioID changed from null to undefined
          // because it used to be sparse, and in version 1.0 it became a default.
          const ignore = isOldAPIVersion( proposedAPI ) &&
                         metadataKey === 'phetioArchetypePhetioID' &&
                         referenceValue === null &&
                         proposedValue === undefined;

          if ( !ignore ) {

            if ( invalidProposedValue === undefined || isDesignedChange ) {
              appendProblem( `${phetioID}.${metadataKey} changed from ${referenceValue} to ${proposedValue}`, isDesignedChange );
              newReference[ METADATA_KEY_NAME ][ metadataKey ] = proposedValue;
            }
            else if ( !isDesignedChange ) {
              if ( proposedValue === invalidProposedValue ) {
                appendProblem( `${phetioID}.${metadataKey} changed from ${referenceValue} to ${proposedValue}` );
                newReference[ METADATA_KEY_NAME ][ metadataKey ] = proposedValue;
              }
              else {

                // value changed, but it was a widening API (adding something to state, or making something read/write)
              }
            }
          }
        }
      };

      // Check for breaking changes
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

      // Check for design changes
      if ( isDesigned ) {
        Object.keys( referenceCompleteMetadata ).forEach( metadataKey => {
          reportDifferences( metadataKey, true );
        } );
      }
    }

    // Recurse to children
    for ( const componentName in reference ) {
      if ( reference.hasOwnProperty( componentName ) && componentName !== METADATA_KEY_NAME ) {

        if ( !proposed.hasOwnProperty( componentName ) ) {
          appendProblem( `PhET-iO Element missing: ${phetioID}.${componentName}`, false );

          if ( isDesigned ) {
            appendProblem( `PhET-iO Element missing: ${phetioID}.${componentName}`, true );
          }

          delete newReference[ componentName ];
        }
        else {
          visit(
            trail.concat( componentName ),
            reference[ componentName ],
            proposed[ componentName ],
            newReference[ componentName ],
            isDesigned
          );
        }
      }
    }
  };

  visit( [], referenceAPI.phetioElements, proposedAPI.phetioElements, newReferenceAPI.phetioElements, false );

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


        if ( referenceAPI.version && proposedAPI.version ) {

          // Check whether the default values have changed. See https://github.com/phetsims/phet-io/issues/1753
          const referenceDefaults = referenceAPI.phetioTypes[ typeName ].metadataDefaults;
          const proposedDefaults = proposedAPI.phetioTypes[ typeName ].metadataDefaults;

          Object.keys( referenceDefaults ).forEach( key => {
            if ( referenceDefaults[ key ] !== proposedDefaults[ key ] ) {
              appendProblem( `${typeName} metadata value ${key} changed from ${referenceDefaults[ key ]} to ${proposedDefaults[ key ]}. This may or may not be a breaking change, but we are reporting it just in case.` );
            }
          } );
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

// @public - used to "up-convert" an old versioned API to the new (version >=1), structured tree api.
_phetioCompareAPIs.toStructuredTree = toStructuredTree;

if ( typeof window === 'undefined' ) {

  // running in node
  module.exports = _phetioCompareAPIs;
}
else {

  window.phetio = window.phetio || {};
  window.phetio.phetioCompareAPIs = _phetioCompareAPIs;
}