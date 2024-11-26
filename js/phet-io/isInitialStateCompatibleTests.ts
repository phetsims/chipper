// Copyright 2024, University of Colorado Boulder
// This PhET-iO file requires a license
// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.
// For licensing, please contact phethelp@colorado.edu

/**
 * isInitialStateCompatible tests
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */


import isInitialStateCompatible from '../browser-and-node/isInitialStateCompatible.js';

QUnit.module( 'isInitialStateCompatible' );

QUnit.test( 'isInitialStateCompatible', assert => {

  // Example 1: Compatible with extra items in test array
  const testObj1 = {
    a: 1,
    b: [
      { min: 0, max: 5 },
      { min: 6, max: 10 },
      { min: 11, max: 15 } // Extra item in test array
    ],
    g: 5
  };

  const groundTruthObj1 = {
    a: 1,
    b: [
      { min: 0, max: 5 },
      { min: 6, max: 10 }
    ]
  };
  assert.equal( isInitialStateCompatible( groundTruthObj1, testObj1 ), false );

  // Example 2: Incompatible due to mismatched value
  const groundTruthObj2 = {
    a: 1,
    b: [
      { min: 0, max: 5 },
      { min: 6, max: 15 } // max value differs
    ]
  };

  assert.equal( isInitialStateCompatible( groundTruthObj2, testObj1 ), false );

  // Example 3: Compatible with nested objects and extra array items
  const testObj2 = {
    a: 1,
    b: [
      { min: 0, max: 5, extra: 'ignore' },
      { min: 6, max: 10 },
      { min: 11, max: 15 }
    ],
    g: 5
  };

  const groundTruthObj3 = {
    b: [
      { min: 0, max: 5 }
    ]
  };

  assert.equal( isInitialStateCompatible( groundTruthObj3, testObj2 ), false );

  // Example 4: Compatible when groundTruth array has same number of elements
  const groundTruthObj4 = {
    b: [
      { min: 0, max: 5 },
      { min: 6, max: 10 },
      { min: 11, max: 15 }
    ]
  };

  assert.equal( isInitialStateCompatible( groundTruthObj4, testObj2 ), true );

  // Example 5: Incompatible due to no corresponding test array item
  const groundTruthObj5 = {
    b: [
      { min: 0, max: 5 },
      { min: 6, max: 10 },
      { min: 16, max: 20 } // No compatible item in test array at index 2
    ]
  };

  assert.equal( isInitialStateCompatible( groundTruthObj5, testObj2 ), false );


  const groundTruthObj6 = {
    a: 1,
    b: [
      { min: 0, max: 5 },
      { min: 6, max: 10 },
      { min: 11, max: 15 },
      { min: 0, max: 10 }
    ],
    g: 5
  };

  assert.equal( isInitialStateCompatible( groundTruthObj6, testObj2 ), false );

  const groundTruthObj7 = {
    a: 1,
    b: [
      { min: 0, max: 5 },
      { min: 6, max: 10 }
    ],
    g: 5
  };

  assert.equal( isInitialStateCompatible( groundTruthObj7, testObj2 ), false );

  // Example 6: Compatible with deeply nested structures
  const testObjA = {
    user: {
      id: 123,
      name: 'Alice',
      roles: [ 'admin', 'editor', 'viewer' ],
      preferences: {
        theme: 'dark',
        notifications: true
      }
    },
    metadata: {
      createdAt: '2023-01-01',
      updatedAt: '2023-06-01'
    }
  };

  const groundTruthObjA = {
    user: {
      id: 123,
      roles: [ 'admin', 'editor' ],
      preferences: {
        theme: 'dark'
      }
    }
  };

  assert.equal( isInitialStateCompatible( groundTruthObjA, testObjA ), false );

  // Example 7: Incompatible due to missing role at specific index
  const groundTruthObjB = {
    user: {
      id: 123,
      roles: [ 'admin', 'viewer' ] // 'manager' role not present at index 1
    }
  };

  assert.equal( isInitialStateCompatible( groundTruthObjB, testObjA ), false );

  // Example 8: Compatible with multiple schema items in groundTruth array
  const testObjC = {
    products: [
      { id: 1, name: 'Laptop', specs: { ram: '16GB', storage: '512GB' } },
      { id: 2, name: 'Phone', specs: { ram: '8GB', storage: '256GB' } },
      { id: 3, name: 'Tablet', specs: { ram: '4GB', storage: '128GB' } }
    ]
  };

  const groundTruthObjC = {
    products: [
      { name: 'Laptop', specs: { ram: '16GB' } },
      { name: 'Phone', specs: { storage: '256GB' } },
      { name: 'Tablet' }

    ]
  };

  assert.equal( isInitialStateCompatible( groundTruthObjC, testObjC ), true );

  // Example 9: Incompatible due to mismatched nested value
  const groundTruthObjD = {
    products: [
      { name: 'Laptop', specs: { ram: '32GB' } } // ram value differs
    ]
  };

  assert.equal( isInitialStateCompatible( groundTruthObjD, testObjC ), false );

  assert.equal( isInitialStateCompatible( {}, {} ), true );
  assert.equal( isInitialStateCompatible( {}, { hi: true } ), true );
} );