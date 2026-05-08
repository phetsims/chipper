// Copyright 2019-2024, University of Colorado Boulder

/**
 * launch point to load any tests located around the chipper repo. This is to support running `qunit` with no args
 * from the top level of chipper, as is the recommended way to run chipper tests.
 *
 * Run from chipper with `npm test`, which routes QUnit through sage/tsx for TypeScript support.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */


import '../common/ChipperStringUtilTests.js';
import '../grunt/modulify/convertStringsYamlToJsonTests.js';
import '../phet-io/phetioCompareAPIsTests.js';
import '../phet-io/isInitialStateCompatibleTests.js';
