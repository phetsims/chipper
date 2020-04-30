// Copyright 2020, University of Colorado Boulder

import Tandem from '../../../tandem/js/Tandem.js';

/**
 * Start Qunit while supporting PhET-iO brand
 */
const qunitStart = () => {

  if ( Tandem.PHET_IO_ENABLED ) {
    import( /* webpackMode: "eager" */ '../../../phet-io/js/phetioEngine.js').then( () => {
      QUnit.start();
    } );
  }
  else {
    QUnit.start();
  }
};

export default qunitStart;