// Copyright 2021-2024, University of Colorado Boulder

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
 * TODO: AFTER_COMMIT Turn this into a typescript module used in sim and Node code, https://github.com/phetsims/phet-io/issues/1951
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
 * See phetioEngine.js for where this is generated in main. Keep in mind that we support different versions, including
 * APIs that don't have a version attribute.
 * @typedef API_1_0
 * @extends API
 * @property {{major:number, minor:number}} version
 * @property {string} sim
 */
( () => {

  const METADATA_KEY_NAME = '_metadata';
  const DATA_KEY_NAME = '_data';

  // Is not the reserved keys to store data/metadata on PhET-iO Elements.
  const isChildKey = key => key !== METADATA_KEY_NAME && key !== DATA_KEY_NAME;

  // TODO: Remove this duplication once phetioCompareAPIs can import isInitialStateCompatible, https://github.com/phetsims/phet-io/issues/1951
  // DUPLICATION ALERT!
  /* @formatter:off */
  function areCompatible( testValue, groundTruthValue ) { if ( Array.isArray( groundTruthValue ) ) { if ( !Array.isArray( testValue ) ) { return false; } if ( testValue.length !== groundTruthValue.length ) { return false; } for ( let i = 0; i < groundTruthValue.length; i++ ) { const newItem = groundTruthValue[ i ]; const oldItem = testValue[ i ]; if ( !areCompatible( oldItem, newItem ) ) { return false; } } return true; } if ( typeof groundTruthValue === 'object' && groundTruthValue !== null ) { if ( typeof testValue !== 'object' || testValue === null || Array.isArray( testValue ) ) { return false; } for ( const key in groundTruthValue ) { if ( groundTruthValue.hasOwnProperty( key ) ) { if ( !testValue.hasOwnProperty( key ) ) { return false; } if ( !areCompatible( testValue[ key ], groundTruthValue[ key ] ) ) { return false; } } } return true; } return testValue === groundTruthValue;}
  const isInitialStateCompatible = ( groundTruthState, testState ) => areCompatible( testState, groundTruthState );
  /* @formatter:on */

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

      // API versions < 1.0, use a tandem separator of '.'  If we ever change this separator in main (hopefully not!)
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
    const ioTypeName = phetioElement[ METADATA_KEY_NAME ] ? ( phetioElement[ METADATA_KEY_NAME ].phetioTypeName || 'ObjectIO' ) : 'ObjectIO';

    if ( api.version ) {
      const defaults = getMetadataDefaults( ioTypeName, api, _, assert );
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

    const appendBothProblems = ( problemString, isDesignedElement ) => {
      appendProblem( problemString, false );
      isDesignedElement && appendProblem( problemString, true );
    };

    /**
     * Visit one element along the APIs.
     * @param {string[]} trail - the path of tandem componentNames
     * @param {Object} reference - current value in the referenceAPI
     * @param {Object} proposed - current value in the proposedAPI
     * @param {boolean} isDesignedElement - are we testing for designed changes, or for breaking changes.
     */
    const visit = ( trail, reference, proposed, isDesignedElement ) => {
      const phetioID = trail.join( '.' );

      // Detect an instrumented instance
      if ( reference.hasOwnProperty( METADATA_KEY_NAME ) ) {

        // Override isDesigned, if specified. Once on, you cannot turn off a subtree.
        isDesignedElement = isDesignedElement || reference[ METADATA_KEY_NAME ].phetioDesigned;

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
                appendProblem( `${phetioID}.${metadataKey} changed from "${referenceValue}" to "${proposedValue}"`, isDesignedChange );
              }
              else if ( !isDesignedChange ) {
                if ( proposedValue === invalidProposedValue ) {
                  appendProblem( `${phetioID}.${metadataKey} changed from "${referenceValue}" to "${proposedValue}"` );
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
        // 'phetioHighFrequency', non-breaking, assuming clients with data have the full data stream

        // Check for design changes
        if ( isDesignedElement ) {
          Object.keys( referenceCompleteMetadata ).forEach( metadataKey => {
            reportDifferences( metadataKey, true );
          } );
        }

        // If the reference file declares an initial state, check that it hasn't changed
        if ( reference._data && reference._data.initialState ) {

          // Detect missing expected state
          if ( !proposed._data || !proposed._data.initialState ) {

            // apiStateKeys "transition" means error more loudly, since we cannot test the apiStateKeys themselves
            if ( apiSupportsAPIStateKeys( referenceAPI ) !== apiSupportsAPIStateKeys( proposedAPI ) ) {

              // Missing but expected state is a breaking problem
              // It is also a designed problem if we expected state in a designed subtree
              appendBothProblems( `${phetioID}._data.initialState is missing from proposed API` );
            }
          }
          else {
            // initialState comparison

            const referencesInitialState = reference._data.initialState;
            const proposedInitialState = proposed._data.initialState;

            const testInitialState = testDesigned => {
              const isCompatible = _.isEqualWith( referencesInitialState, proposedInitialState,
                ( referenceState, proposedState ) => {

                  // Top level object comparison of the entire state (not a component piece)
                  if ( referencesInitialState === referenceState && proposedInitialState === proposedState ) {

                    // The validValues of the localeProperty changes each time a new translation is submitted for a sim.
                    if ( phetioID === trail[ 0 ] + '.general.model.localeProperty' ) {

                      // We do not worry about the notion of "designing" available locales. For breaking changes: the sim
                      // must have all expected locales, but it is acceptable to add new one without API error.
                      return testDesigned || referenceState.validValues.every( validValue => proposedState.validValues.includes( validValue ) );
                    }
                    else if ( testDesigned ) {
                      return undefined; // Meaning use the default lodash algorithm for comparison.
                    }
                    else {
                      // Breaking change test uses the general algorithm for initial state compatibility.
                      // referenceState is the ground truth for compatibility
                      return isInitialStateCompatible( referenceState, proposedState );
                    }
                  }

                  return undefined; // Meaning use the default lodash algorithm for comparison.
                } );
              if ( !isCompatible ) {
                const problemString = `${phetioID}._data.initialState differs. \nExpected:\n${JSON.stringify( reference._data.initialState )}\n actual:\n${JSON.stringify( proposed._data.initialState )}\n`;

                // Report only designed problems if on a designed element.
                const reportTheProblem = !testDesigned || isDesignedElement;
                reportTheProblem && appendProblem( problemString, testDesigned );
              }
            };

            // It is also a designed problem if the proposed values deviate from the specified designed values
            testInitialState( true );
            // A changed state value could break a client wrapper, so identify it with breaking changes.
            testInitialState( false );
          }
        }
      }
      else if ( proposed._data?.initialState ) {

        // We don't have reference state, but do have a new initialState. this is a designed change
        isDesignedElement && appendProblem(
          `${phetioID}._data.initialState is not in reference API but is in proposed`, true );
      }

      // Recurse to children
      for ( const componentName in reference ) {
        if ( reference.hasOwnProperty( componentName ) && isChildKey( componentName ) ) {

          if ( !proposed.hasOwnProperty( componentName ) ) {
            appendBothProblems( `PhET-iO Element missing: ${phetioID}.${componentName}`, isDesignedElement );
          }
          else {
            visit(
              trail.concat( componentName ),
              reference[ componentName ],
              proposed[ componentName ],
              isDesignedElement
            );
          }
        }
      }

      for ( const componentName in proposed ) {
        if ( isDesignedElement && proposed.hasOwnProperty( componentName ) && isChildKey( componentName ) && !reference.hasOwnProperty( componentName ) ) {
          appendProblem( `New PhET-iO Element (or uninstrumented intermediate container) not in reference: ${phetioID}.${componentName}`, true );
        }
      }
    };

    visit( [], referenceAPI.phetioElements, proposedAPI.phetioElements, false );

    // Check for: missing IOTypes, missing methods, or differing parameter types or return types
    for ( const typeName in referenceAPI.phetioTypes ) {
      // TODO: AFTER_COMMIT We need a notion of phetioDesigned for Type comparison. https://github.com/phetsims/phet-io/issues/1951
      // TODO: AFTER_COMMIT add comparison for stateSchema https://github.com/phetsims/phet-io/issues/1951

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

          if ( apiSupportsAPIStateKeys( referenceAPI ) &&
               apiSupportsAPIStateKeys( proposedAPI ) ) {
            if ( !!referenceType.apiStateKeys !== !!proposedType.apiStateKeys ) {
              const result = referenceType.apiStateKeys ? 'present' : 'absent';
              const problemString = `${typeName} apiStateKeys unexpectedly ${result}`;
              appendProblem( problemString, true );

              // Breaking if we lost apiStateKeys
              referenceType.apiStateKeys && appendProblem( problemString, false );
            }
            else {
              const referenceAPIStateKeys = referenceType.apiStateKeys;
              const proposedAPIStateKeys = proposedType.apiStateKeys;

              if ( !_.isEqual( referenceAPIStateKeys, proposedAPIStateKeys ) ) {
                const inReferenceNotProposed = _.difference( referenceAPIStateKeys, proposedAPIStateKeys );
                const inProposedNotReference = _.difference( proposedAPIStateKeys, referenceAPIStateKeys );

                appendProblem( `${typeName} apiStateKeys differ:\n` +
                               `  In reference: ${inReferenceNotProposed}\n` +
                               `  In proposed: ${inProposedNotReference}`, true );

                // It is only breaking if we lost an apiStateKey
                if ( !_.every( referenceAPIStateKeys, reference => proposedAPIStateKeys.includes( reference ) ) ) {
                  appendProblem( `${typeName} apiStateKeys missing from proposed: ${inReferenceNotProposed}`, false );
                }
              }
            }
          }

          // make sure we have matching supertype names
          const referenceSupertypeName = referenceType.supertype;
          const proposedSupertypeName = proposedType.supertype;
          if ( referenceSupertypeName !== proposedSupertypeName ) {
            appendProblem( `${typeName} supertype changed from "${referenceSupertypeName}" to "${proposedSupertypeName}". This may or may not 
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
                appendProblem( `${typeName} metadata value ${key} changed from "${referenceDefaults[ key ]}" to "${proposedDefaults[ key ]}". This may or may not be a breaking change, but we are reporting it just in case.` );
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

  const apiSupportsAPIStateKeys = api => api.version && api.version.major >= 1 && api.version.minor >= 1;

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