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


import isInitialStateCompatible from './isInitialStateCompatible.js';

QUnit.module( 'isInitialStateCompatible' );

QUnit.test( 'isInitialStateCompatible', assert => {


  // Example 1: Compatible with extra items in old array
  const oldObj1 = {
    a: 1,
    b: [
      { min: 0, max: 5 },
      { min: 6, max: 10 },
      { min: 11, max: 15 } // Extra item in old array
    ],
    g: 5
  };

  const newObj1 = {
    a: 1,
    b: [
      { min: 0, max: 5 },
      { min: 6, max: 10 }
    ]
  };
  assert.equal( isInitialStateCompatible( oldObj1, newObj1 ), true );

  // Example 2: Incompatible due to mismatched value
  const newObj2 = {
    a: 1,
    b: [
      { min: 0, max: 5 },
      { min: 6, max: 15 } // max value differs
    ]
  };

  assert.equal( isInitialStateCompatible( oldObj1, newObj2 ), false );

  // Example 3: Compatible with nested objects and extra array items
  const oldObj2 = {
    a: 1,
    b: [
      { min: 0, max: 5, extra: 'ignore' },
      { min: 6, max: 10 },
      { min: 11, max: 15 }
    ],
    g: 5
  };

  const newObj3 = {
    b: [
      { min: 0, max: 5 }
    ]
  };

  assert.equal( isInitialStateCompatible( oldObj2, newObj3 ), true );

  // Example 4: Compatible when new array has same number of elements
  const newObj4 = {
    b: [
      { min: 0, max: 5 },
      { min: 6, max: 10 },
      { min: 11, max: 15 }
    ]
  };

  assert.equal( isInitialStateCompatible( oldObj2, newObj4 ), true );

  // Example 5: Incompatible due to no corresponding old array item
  const newObj5 = {
    b: [
      { min: 0, max: 5 },
      { min: 6, max: 10 },
      { min: 16, max: 20 } // No compatible item in old array at index 2
    ]
  };

  assert.equal( isInitialStateCompatible( oldObj2, newObj5 ), false );

  // Example 6: Compatible with deeply nested structures
  const oldObjA = {
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

  const newObjA = {
    user: {
      id: 123,
      roles: [ 'admin', 'editor' ],
      preferences: {
        theme: 'dark'
      }
    }
  };

  assert.equal( isInitialStateCompatible( oldObjA, newObjA ), true );

  // Example 7: Incompatible due to missing role at specific index
  const newObjB = {
    user: {
      id: 123,
      roles: [ 'admin', 'viewer' ] // 'manager' role not present at index 1
    }
  };

  assert.equal( isInitialStateCompatible( oldObjA, newObjB ), false );

  // Example 8: Compatible with multiple schema items in new array
  const oldObjC = {
    products: [
      { id: 1, name: 'Laptop', specs: { ram: '16GB', storage: '512GB' } },
      { id: 2, name: 'Phone', specs: { ram: '8GB', storage: '256GB' } },
      { id: 3, name: 'Tablet', specs: { ram: '4GB', storage: '128GB' } }
    ]
  };

  const newObjC = {
    products: [
      { name: 'Laptop', specs: { ram: '16GB' } },
      { name: 'Phone', specs: { storage: '256GB' } }
    ]
  };

  assert.equal( isInitialStateCompatible( oldObjC, newObjC ), true );

  // Example 9: Incompatible due to mismatched nested value
  const newObjD = {
    products: [
      { name: 'Laptop', specs: { ram: '32GB' } } // ram value differs
    ]
  };

  assert.equal( isInitialStateCompatible( oldObjC, newObjD ), false );
} );