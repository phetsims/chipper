// Copyright 2021-2025, University of Colorado Boulder

/**
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import _ from 'lodash';
import qunit from '../../../perennial-alias/js/npm-dependencies/qunit.js';
import { PhetioAPI } from '../../../tandem/js/phet-io-types.js';
import phetioCompareAPIs, { PhetioCompareAPIsOptions } from '../browser-and-node/phetioCompareAPIs.js';

qunit.module( 'phetioCompareAPIs' );

const _phetioCompareAPIs = ( referenceAPI: PhetioAPI, proposedAPI: PhetioAPI, options?: PhetioCompareAPIsOptions ) => {
  return phetioCompareAPIs( referenceAPI, proposedAPI, _, options );
};

// To cover the boilerplate that will be largely copied around otherwise.
const DEFAULT_API = {
  phetioElements: {},
  phetioFullAPI: true,
  phetioTypes: {
    ObjectIO: {
      documentation: 'The root of the PhET-iO Type hierarchy',
      events: [],
      metadataDefaults: {
        phetioArchetypePhetioID: null,
        phetioDesigned: false,
        phetioDocumentation: '',
        phetioDynamicElement: false,
        phetioEventType: 'MODEL',
        phetioFeatured: false,
        phetioHighFrequency: false,
        phetioIsArchetype: false,
        phetioPlayback: false,
        phetioReadOnly: false,
        phetioState: true,
        phetioTypeName: 'ObjectIO'
      },
      methodOrder: [],
      methods: {},
      parameterTypes: [],
      supertype: null,
      typeName: 'ObjectIO'
    }
  },
  sim: 'natural-selection',
  version: {
    major: 1,
    minor: 0
  }
};


qunit.test( 'basics', assert => {

  const referenceAPI = _.merge( {
    phetioElements: {
      phetioEngine: {
        _metadata: {
          phetioDocumentation: 'Central point for PhET-iO interoperability. Please see the PhET-iO Type Documentation for API details.',
          phetioEventType: 'MODEL',
          phetioState: false,
          phetioTypeName: 'ObjectIO'
        }
      }
    }
  }, DEFAULT_API );

  const proposedAPI = _.cloneDeep( referenceAPI );

  let report = _phetioCompareAPIs( referenceAPI as unknown as PhetioAPI, proposedAPI as unknown as PhetioAPI );

  assert.ok( report.breakingProblems.length === 0, 'no breaking problems when compare to self' );
  assert.ok( report.designedProblems.length === 0, 'no designed problems when compare to self' );


  // @ts-expect-error
  proposedAPI.phetioElements.phetioEngine._metadata.phetioPlayback = true;

  report = _phetioCompareAPIs( referenceAPI as unknown as PhetioAPI, proposedAPI as unknown as PhetioAPI );

  assert.ok( report.breakingProblems.length === 1, 'no breaking problems when compare to self' );
  assert.ok( report.designedProblems.length === 0, 'no designed problems when compare to self' );
} );


qunit.test( 'designed changes', assert => {
  const referenceAPI = _.merge( {
    phetioElements: {
      designedElement: {
        _metadata: {
          phetioDesigned: true
        },
        designedChild: {
          _metadata: {}
        }
      }
    }
  }, DEFAULT_API );

  const proposedAPI = _.cloneDeep( referenceAPI );

  // @ts-expect-error
  proposedAPI.phetioElements.designedElement._metadata.phetioDocumentation = 'changed though I am designed, oh boy, this cannot be good.';

  let report = _phetioCompareAPIs( referenceAPI as unknown as PhetioAPI, proposedAPI as unknown as PhetioAPI );
  assert.ok( report.breakingProblems.length === 0, 'no breaking problems when compare to design change' );
  assert.ok( report.designedProblems.length === 1, 'no designed problems when changing designed problem' );

  // @ts-expect-error
  proposedAPI.phetioElements.designedElement.designedChild._metadata.phetioDocumentation =
    'changed though I am a child of designed, oh boy, this cannot be good.';

  report = _phetioCompareAPIs( referenceAPI as unknown as PhetioAPI, proposedAPI as unknown as PhetioAPI );
  assert.ok( report.breakingProblems.length === 0, 'no breaking problems when compare to design change' );
  assert.ok( report.designedProblems.length === 2, 'no designed problems when changing designed problem on child' );


  // in the reference, but not the proposed
  // @ts-expect-error
  referenceAPI.phetioElements.designedElement.otherChild = { _metadata: {} };
  report = _phetioCompareAPIs( referenceAPI as unknown as PhetioAPI, proposedAPI as unknown as PhetioAPI );
  assert.ok( report.breakingProblems.length === 1, 'cannot delete children like otherChild' );

  // test shut off switch suppresses problems
  report = _phetioCompareAPIs( referenceAPI as unknown as PhetioAPI, proposedAPI as unknown as PhetioAPI, {
    compareDesignedAPIChanges: false,
    compareBreakingAPIChanges: false
  } );
  assert.ok( report.breakingProblems.length === 0, 'no breaking problems if not testing for them' );
  assert.ok( report.designedProblems.length === 0, 'no designed problems if not testing for them' );
} );


qunit.test( 'breaking element API changes', assert => {
  const referenceAPI = _.merge( {
    phetioElements: {
      breakingElement: {
        _metadata: {
          phetioDesigned: true
        },
        designedChild: {
          _metadata: {}
        }
      }
    }
  }, DEFAULT_API );

  let proposedAPI = _.cloneDeep( referenceAPI );

  // @ts-expect-error
  delete proposedAPI.phetioElements.breakingElement.designedChild;

  let report = _phetioCompareAPIs( referenceAPI as unknown as PhetioAPI, proposedAPI as unknown as PhetioAPI );
  assert.ok( report.breakingProblems.length === 1, 'missing an element' );
  assert.ok( report.designedProblems.length === 1, 'missing element is also a designed problem' );

  referenceAPI.phetioElements.breakingElement._metadata.phetioDesigned = false;

  report = _phetioCompareAPIs( referenceAPI as unknown as PhetioAPI, proposedAPI as unknown as PhetioAPI );
  assert.ok( report.breakingProblems.length === 1, 'missing an element' );
  assert.ok( report.designedProblems.length === 0, 'not a problem if not designed in the reference' );

  const testMetadataKeyChange = ( metadataKey: string, valueThatBreaksAPI: string | boolean ) => {

    proposedAPI = _.cloneDeep( referenceAPI );

    // @ts-expect-error
    proposedAPI.phetioElements.breakingElement._metadata[ metadataKey ] = valueThatBreaksAPI;

    report = _phetioCompareAPIs( referenceAPI as unknown as PhetioAPI, proposedAPI as unknown as PhetioAPI, {
      compareDesignedAPIChanges: false
    } );
    assert.ok( report.breakingProblems.length === 1, `it is a breaking change for ${metadataKey} to become ${valueThatBreaksAPI}` );
  };

  // All values that would constitute a breaking change, sometimes breaking the comparison task with an assertion.
  const metadataBreakingData = [
    { metadataKey: 'phetioTypeName', value: 'OtherTypeIO', assert: true },
    { metadataKey: 'phetioTypeName', value: true, assert: true },
    { metadataKey: 'phetioEventType', value: true },
    { metadataKey: 'phetioEventType', value: 'MOdDEL' },
    { metadataKey: 'phetioEventType', value: 'USER' },
    { metadataKey: 'phetioPlayback', value: true },
    { metadataKey: 'phetioPlayback', value: '"a string"' },
    { metadataKey: 'phetioDynamicElement', value: true },
    { metadataKey: 'phetioIsArchetype', value: true },
    { metadataKey: 'phetioIsArchetype', value: 'hi' },
    { metadataKey: 'phetioArchetypePhetioID', value: true },
    { metadataKey: 'phetioArchetypePhetioID', value: false },
    { metadataKey: 'phetioArchetypePhetioID', value: 'wrongPhetioID' },
    { metadataKey: 'phetioState', value: false },
    { metadataKey: 'phetioReadOnly', value: true }
  ];

  metadataBreakingData.forEach( testData => {

    const test = () => testMetadataKeyChange( testData.metadataKey, testData.value );

    if ( testData.assert ) {
      assert.throws( () => {
        test();
        // @ts-expect-error
      }, `assertion expected with key: ${testData.key}, and wrong value: ${testData.value}` );
    }
    else {
      test();
    }
  } );
} );

qunit.test( 'testing PhetioTypes', assert => {
  const referenceAPI = {
    version: { major: 1, minor: 1 },
    phetioElements: {},
    phetioTypes: {
      'PropertyIO<Vector2IO>': {
        apiStateKeys: [
          'validValues',
          'units'
        ],
        dataDefaults: {},
        documentation: 'Observable values that send out notifications when the value changes. This differs from the traditional listener pattern in that added listeners also receive a callback with the current value when the listeners are registered. This is a widely-used pattern in PhET-iO simulations.',
        events: [
          'changed'
        ],
        metadataDefaults: {},
        methodOrder: [
          'link',
          'lazyLink'
        ],
        methods: {
          getValidationError: {
            documentation: 'Checks to see if a proposed value is valid. Returns the first validation error, or null if the value is valid.',
            parameterTypes: [
              'Vector2IO'
            ],
            returnType: 'NullableIO<StringIO>'
          },
          getValue: {
            documentation: 'Gets the current value.',
            parameterTypes: [],
            returnType: 'Vector2IO'
          },
          lazyLink: {
            documentation: 'Adds a listener which will be called when the value changes. This method is like "link", but without the current-value callback on registration. The listener takes two arguments, the new value and the previous value.',
            parameterTypes: [
              'FunctionIO(Vector2IO,NullableIO<Vector2IO>)=>VoidIO'
            ],
            returnType: 'VoidIO'
          },
          link: {
            documentation: 'Adds a listener which will be called when the value changes. On registration, the listener is also called with the current value. The listener takes two arguments, the new value and the previous value.',
            parameterTypes: [
              'FunctionIO(Vector2IO,NullableIO<Vector2IO>)=>VoidIO'
            ],
            returnType: 'VoidIO'
          },
          setValue: {
            documentation: 'Sets the value of the Property. If the value differs from the previous value, listeners are notified with the new value.',
            invocableForReadOnlyElements: false,
            parameterTypes: [
              'Vector2IO'
            ],
            returnType: 'VoidIO'
          },
          unlink: {
            documentation: 'Removes a listener.',
            parameterTypes: [
              'FunctionIO(Vector2IO)=>VoidIO'
            ],
            returnType: 'VoidIO'
          }
        },
        parameterTypes: [
          'Vector2IO'
        ],
        stateSchema: {
          units: 'NullableIO<StringIO>',
          validValues: 'NullableIO<ArrayIO<Vector2IO>>',
          value: 'Vector2IO'
        },
        supertype: 'ObjectIO',
        typeName: 'PropertyIO<Vector2IO>'
      }
    }
  };

  const proposedAPI = _.cloneDeep( referenceAPI );


  let report = _phetioCompareAPIs( referenceAPI as unknown as PhetioAPI, proposedAPI as unknown as PhetioAPI );
  assert.ok( report.breakingProblems.length === 0, 'missing an element' );
  assert.ok( report.designedProblems.length === 0, 'missing element is also a designed problem' );

  const propertyIOEntry = proposedAPI.phetioTypes[ 'PropertyIO<Vector2IO>' ];
  propertyIOEntry.apiStateKeys.push( 'hi' );

  report = _phetioCompareAPIs( referenceAPI as unknown as PhetioAPI, proposedAPI as unknown as PhetioAPI );
  assert.ok( report.breakingProblems.length === 0, 'missing an element' );
  assert.ok( report.designedProblems.length === 1, 'apiStateKeys cannot be different for designed' );

  propertyIOEntry.apiStateKeys = propertyIOEntry.apiStateKeys.slice( 0, 1 );
  report = _phetioCompareAPIs( referenceAPI as unknown as PhetioAPI, proposedAPI as unknown as PhetioAPI );
  assert.ok( report.breakingProblems.length === 1 );
  assert.ok( report.designedProblems.length === 1 );

  // @ts-expect-error
  delete propertyIOEntry.apiStateKeys;
  report = _phetioCompareAPIs( referenceAPI as unknown as PhetioAPI, proposedAPI as unknown as PhetioAPI );
  assert.ok( report.breakingProblems.length === 1 );
  assert.ok( report.designedProblems.length === 1 );

  propertyIOEntry.apiStateKeys = [ 'hi' ];
  // @ts-expect-error
  delete referenceAPI.phetioTypes[ 'PropertyIO<Vector2IO>' ].apiStateKeys;
  report = _phetioCompareAPIs( referenceAPI as unknown as PhetioAPI, proposedAPI as unknown as PhetioAPI );
  assert.ok( report.breakingProblems.length === 0 );
  assert.ok( report.designedProblems.length === 1 );
} );