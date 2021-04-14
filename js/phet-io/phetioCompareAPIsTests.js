// Copyright 2021, University of Colorado Boulder

/**
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

'use strict';

const qunit = require( 'qunit' );
const assert = require( 'assert' );
const _phetioCompareAPIs = require( './phetioCompareAPIs' ); // eslint-disable-line require-statement-match
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match

qunit.module( 'phetioCompareAPIs' );

const phetioCompareAPIs = ( referenceAPI, proposedAPI, options ) => {
  return _phetioCompareAPIs( referenceAPI, proposedAPI, _, assert, options );
};

// To cover the boilerplate that will be largely copied around otherwise.
const DEFAULT_API = {
  phetioElements: {},
  phetioFullAPI: true,
  phetioTypes: {
    ObjectIO: {
      documentation: 'The root of the IO Type hierarchy',
      events: [],
      metadataDefaults: {
        phetioArchetypePhetioID: null,
        phetioDesigned: false,
        phetioDocumentation: '',
        phetioDynamicElement: false,
        phetioFeatured: false,
        phetioHighFrequency: false,
        phetioIsArchetype: false,
        phetioPlayback: false,
        phetioReadOnly: false,
        phetioState: true,
        phetioStudioControl: true,
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
          phetioDocumentation: 'Central point for PhET-iO interoperability. Please see the IO Type Documentation for API details.',
          phetioEventType: 'MODEL',
          phetioState: false,
          phetioTypeName: 'ObjectIO'
        }
      }
    }
  }, DEFAULT_API );

  const proposedAPI = _.cloneDeep( referenceAPI );

  let report = phetioCompareAPIs( referenceAPI, proposedAPI );

  assert.ok( report.breakingProblems.length === 0, 'no breaking problems when compare to self' );
  assert.ok( report.designedProblems.length === 0, 'no designed problems when compare to self' );


  proposedAPI.phetioElements.phetioEngine._metadata.phetioPlayback = true;

  report = phetioCompareAPIs( referenceAPI, proposedAPI );

  assert.ok( report.breakingProblems.length === 1, 'no breaking problems when compare to self' );
  assert.ok( report.designedProblems.length === 0, 'no designed problems when compare to self' );
  assert.ok( report.newAPI.phetioElements.phetioEngine._metadata.phetioPlayback ===
             proposedAPI.phetioElements.phetioEngine._metadata.phetioPlayback,
    'no designed problems when compare to self' );

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

  proposedAPI.phetioElements.designedElement._metadata.phetioDocumentation = 'changed though I am designed, oh boy, this cannot be good.';

  let report = phetioCompareAPIs( referenceAPI, proposedAPI );
  assert.ok( report.breakingProblems.length === 0, 'no breaking problems when compare to design change' );
  assert.ok( report.designedProblems.length === 1, 'no designed problems when changing designed problem' );

  proposedAPI.phetioElements.designedElement.designedChild._metadata.phetioDocumentation =
    'changed though I am a child of designed, oh boy, this cannot be good.';

  report = phetioCompareAPIs( referenceAPI, proposedAPI );
  assert.ok( report.breakingProblems.length === 0, 'no breaking problems when compare to design change' );
  assert.ok( report.designedProblems.length === 2, 'no designed problems when changing designed problem on child' );
  assert.ok( report.newAPI.phetioElements.designedElement.designedChild._metadata.phetioDocumentation ===
             proposedAPI.phetioElements.designedElement.designedChild._metadata.phetioDocumentation,
    'overwrite should work for designed differences' );


  // in the reference, but not the proposed
  referenceAPI.phetioElements.designedElement.otherChild = { _metadata: {} };
  report = phetioCompareAPIs( referenceAPI, proposedAPI );
  assert.ok( report.breakingProblems.length === 1, 'cannot delete children like otherChild' );

  // test shut off switch suppresses problems
  report = phetioCompareAPIs( referenceAPI, proposedAPI, {
    compareDesignedAPIChanges: false,
    compareBreakingAPIChanges: false
  } );
  assert.ok( report.breakingProblems.length === 0, 'no breaking problems if not testing for them' );
  assert.ok( report.designedProblems.length === 0, 'no designed problems if not testing for them' );
} );


qunit.test( 'breaking to miss element', assert => {
  const referenceAPI = _.merge( {
    phetioElements: {
      element: {
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

  delete proposedAPI.phetioElements.element.designedChild;

  let report = phetioCompareAPIs( referenceAPI, proposedAPI );
  assert.ok( report.breakingProblems.length === 1, 'missing an element' );
  assert.ok( report.designedProblems.length === 1, 'missing element is also a designed problem' );

  referenceAPI.phetioElements.element._metadata.phetioDesigned = false;

  report = phetioCompareAPIs( referenceAPI, proposedAPI );
  assert.ok( report.breakingProblems.length === 1, 'missing an element' );
  assert.ok( report.designedProblems.length === 0, 'not a problem if not designed in the reference' );
} );
