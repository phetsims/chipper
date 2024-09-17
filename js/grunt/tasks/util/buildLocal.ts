// Copyright 2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

import * as grunt from 'grunt';
import IntentionalAny from '../../../../../phet-core/js/types/IntentionalAny.js';

let buildLocal: IntentionalAny;
try {
  buildLocal = grunt.file.readJSON( `${process.env.HOME}/.phet/build-local.json` );
}
catch( e ) {
  // Handle the lack of build.json
  buildLocal = {};
}

export default buildLocal;