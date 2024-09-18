// Copyright 2013-2024, University of Colorado Boulder

/**
 * Outputs JS for all repos
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
// Import something to trigger imports mode. TODO https://github.com/phetsims/chipper/issues/1459 a better way?
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';

const Transpiler = require( '../../common/Transpiler' );
const transpiler = new Transpiler( { silent: true } );

transpiler.transpileAll();