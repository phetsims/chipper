// Copyright 2021, University of Colorado Boulder

/**
 * Compare PhET-iO APIs for two versions of the same sim. This function treats the first API as the "ground truth"
 * and compares the second API to see if it has any breaking changes against the first API. This function returns a
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
 * extends API // TODO: https://github.com/phetsims/chipper/issues/1054 TS cannot support the at symbol on this extends
 * @property {{major:number, minor:number}} version
 * @property {string} sim
 */
( () => {

  const METADATA_KEY_NAME = '_metadata';
  const DATA_KEY_NAME = '_data';

  // Is not the reserved keys to store data/metadata on PhET-iO elements.
  const isChildKey = key => key !== METADATA_KEY_NAME && key !== DATA_KEY_NAME;

  /**
   * "up-convert" an API to be in the format of API version >=1.0. This generally is thought of as a "sparse, tree-like" API.
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

      // API versions < 1.0, use a tandem separator of '.'  If we ever change this separator in master (hopefully not!)
      // this value wouldn't change since it reflects the prior committed versions which do use '.'
      const chain = phetioID.split( '.' );

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
    const typeName = phetioElement[ METADATA_KEY_NAME ] ? ( phetioElement[ METADATA_KEY_NAME ].phetioTypeName || 'ObjectIO' ) : 'ObjectIO';

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
   * @param {API} referenceAPI - the "ground truth" or reference API
   * @param {API} proposedAPI - the proposed API for comparison with referenceAPI
   * @param _ - lodash, so this can be used from different contexts.
   * @param {function|undefined} assert - so this can be used from different contexts
   * @param {Object} [options]
   * @returns {{breakingProblems:string[], designedProblems:string[]}}
   */
  const _phetioCompareAPIs = ( referenceAPI, proposedAPI, _, assert, options ) => {

    // If the proposed version predates 1.0, then bring it forward to the structured tree with metadata under `_metadata`.
    if ( isOldAPIVersion( proposedAPI ) ) {
      proposedAPI = toStructuredTree( proposedAPI, _ );
    }

    if ( isOldAPIVersion( referenceAPI ) ) {
      referenceAPI = toStructuredTree( referenceAPI, _ );
    }

    options = _.merge( {
      compareDesignedAPIChanges: true,
      compareBreakingAPIChanges: true
    }, options );

    const breakingProblems = [];
    const designedProblems = [];

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
     * @param {boolean} isDesigned
     */
    const visit = ( trail, reference, proposed, isDesigned ) => {
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
        const reportDifferences = ( metadataKey, isDesignedChange, invalidProposedValue ) => {
          const referenceValue = referenceCompleteMetadata[ metadataKey ];

          // Gracefully handle missing metadata from the <1.0 API format
          const proposedValue = proposedCompleteMetadata ? proposedCompleteMetadata[ metadataKey ] : {};

          if ( referenceValue !== proposedValue ) {

            // if proposed API is older (no version specified), ignore phetioArchetypePhetioID changed from null to undefined
            // because it used to be sparse, and in version 1.0 it became a default.
            const ignoreBrokenProposed = isOldAPIVersion( proposedAPI ) &&
                                         metadataKey === 'phetioArchetypePhetioID' &&
                                         referenceValue === null &&
                                         proposedValue === undefined;

            const ignoreBrokenReference = isOldAPIVersion( referenceAPI ) &&
                                          metadataKey === 'phetioArchetypePhetioID' &&
                                          proposedValue === null &&
                                          referenceValue === undefined;

            const ignore = ignoreBrokenProposed || ignoreBrokenReference;

            if ( !ignore ) {

              if ( invalidProposedValue === undefined || isDesignedChange ) {
                appendProblem( `${phetioID}.${metadataKey} changed from ${referenceValue} to ${proposedValue}`, isDesignedChange );
              }
              else if ( !isDesignedChange ) {
                if ( proposedValue === invalidProposedValue ) {
                  appendProblem( `${phetioID}.${metadataKey} changed from ${referenceValue} to ${proposedValue}` );
                }
                else {

                  // value changed, but it was a widening API (adding something to state, or making something read/write)
                }
              }
            }
          }
        };

        // Check for breaking changes
        reportDifferences( 'phetioTypeName', false );
        reportDifferences( 'phetioEventType', false );
        reportDifferences( 'phetioPlayback', false );
        reportDifferences( 'phetioDynamicElement', false );
        reportDifferences( 'phetioIsArchetype', false );
        reportDifferences( 'phetioArchetypePhetioID', false );
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

        // If the reference file declares an initial state, check that it hasn't changed
        if ( reference._data && reference._data.initialState ) {

          // Detect missing expected state
          if ( !proposed._data || !proposed._data.initialState ) {
            const problemString = `${phetioID}._data.initialState is missing`;

            // Missing but expected state is a breaking problem
            appendProblem( problemString, false );

            // It is also a designed problem if we expected state in a designed subtree
            isDesigned && appendProblem( problemString, true );
          }
          else {

            const equals = _.isEqual( reference._data.initialState, proposed._data.initialState );
            if ( !equals ) {
              const problemString = `${phetioID}._data.initialState differs. \nExpected:\n${JSON.stringify( reference._data.initialState )}\n actual:\n${JSON.stringify( proposed._data.initialState )}\n`;

              // A changed state value could break a client wrapper, so identify it with breaking changes.
              appendProblem( problemString, false );

              // It is also a designed problem if the proposed values deviate from the specified designed values
              isDesigned && appendProblem( problemString, true );
            }
          }
        }
      }

      // Recurse to children
      for ( const componentName in reference ) {
        if ( reference.hasOwnProperty( componentName ) && isChildKey( componentName ) ) {

          if ( !proposed.hasOwnProperty( componentName ) ) {
            const problemString = `PhET-iO Element missing: ${phetioID}.${componentName}`;
            appendProblem( problemString, false );

            if ( isDesigned ) {
              appendProblem( problemString, true );
            }
          }
          else {
            visit(
              trail.concat( componentName ),
              reference[ componentName ],
              proposed[ componentName ],
              isDesigned
            );
          }
        }
      }

      for ( const componentName in proposed ) {
        if ( isDesigned && proposed.hasOwnProperty( componentName ) && isChildKey( componentName ) && !reference.hasOwnProperty( componentName ) ) {
          appendProblem( `New PhET-iO Element not in reference: ${phetioID}.${componentName}`, true );
        }
      }
    };

    visit( [], referenceAPI.phetioElements, proposedAPI.phetioElements, false );

    // Check for: missing IO Types, missing methods, or differing parameter types or return types
    for ( const typeName in referenceAPI.phetioTypes ) {
      if ( referenceAPI.phetioTypes.hasOwnProperty( typeName ) ) {

        // make sure we have the desired type
        if ( !proposedAPI.phetioTypes.hasOwnProperty( typeName ) ) {
          appendProblem( `Type missing: ${typeName}` );
        }
        else {
          const referenceType = referenceAPI.phetioTypes[ typeName ];
          const proposedType = proposedAPI.phetioTypes[ typeName ];

          // make sure we have all of the methods
          const referenceMethods = referenceType.methods;
          const proposedMethods = proposedType.methods;
          for ( const referenceMethod in referenceMethods ) {
            if ( referenceMethods.hasOwnProperty( referenceMethod ) ) {
              if ( !proposedMethods.hasOwnProperty( referenceMethod ) ) {
                appendProblem( `Method missing, type=${typeName}, method=${referenceMethod}` );
              }
              else {

                // check parameter types (exact match)
                const referenceParams = referenceMethods[ referenceMethod ].parameterTypes;
                const proposedParams = proposedMethods[ referenceMethod ].parameterTypes;

                if ( referenceParams.join( ',' ) !== proposedParams.join( ',' ) ) {
                  appendProblem( `${typeName}.${referenceMethod} has different parameter types: [${referenceParams.join( ', ' )}] => [${proposedParams.join( ', ' )}]` );
                }

                const referenceReturnType = referenceMethods[ referenceMethod ].returnType;
                const proposedReturnType = proposedMethods[ referenceMethod ].returnType;
                if ( referenceReturnType !== proposedReturnType ) {
                  appendProblem( `${typeName}.${referenceMethod} has a different return type ${referenceReturnType} => ${proposedReturnType}` );
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
            }
          } );

          // make sure we have matching supertype names
          const referenceSupertypeName = referenceType.supertype;
          const proposedSupertypeName = proposedType.supertype;
          if ( referenceSupertypeName !== proposedSupertypeName ) {
            appendProblem( `${typeName} supertype changed from ${referenceSupertypeName} to ${proposedSupertypeName}. This may or may not 
          be a breaking change, but we are reporting it just in case.` );
          }

          // make sure we have matching parameter types
          const referenceParameterTypes = referenceType.parameterTypes || [];
          const proposedParameterTypes = proposedType.parameterTypes;
          if ( !_.isEqual( referenceParameterTypes, proposedParameterTypes ) ) {
            appendProblem( `${typeName} parameter types changed from [${referenceParameterTypes.join( ', ' )}] to [${proposedParameterTypes.join( ', ' )}]. This may or may not 
          be a breaking change, but we are reporting it just in case.` );
          }

          // This check assumes that each API will be of a version that has metadataDefaults
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
      breakingProblems: breakingProblems,
      designedProblems: designedProblems
    };
  };

// @public - used to "up-convert" an old versioned API to the new (version >=1), structured tree API.
  _phetioCompareAPIs.toStructuredTree = toStructuredTree;

  if ( typeof window === 'undefined' ) {

    // running in node
    module.exports = _phetioCompareAPIs;
  }
  else {

    window.phetio = window.phetio || {};
    window.phetio.phetioCompareAPIs = _phetioCompareAPIs;
  }
} )();
