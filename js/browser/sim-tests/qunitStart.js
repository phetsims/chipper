// Copyright 2020-2025, University of Colorado Boulder

import isPhetioEnabled from '../../../../phet-core/js/isPhetioEnabled.js';
import { qunitStartImplementation } from './qunitStartWithoutPhetio.js';

/**
 * Start Qunit while all runtime modalities (phet-io/debugging/headless puppeteer). Adding support
 * for phet-io when it is enabled
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
const qunitStart = () => {
  qunitStartImplementation( () => {
    if ( isPhetioEnabled ) {
      import( /* webpackMode: "eager" */ '../../../../phet-io/js/phetioEngine.js' ).then( () => {

        // no API validation in unit tests
        phet.tandem.Tandem.apiValidationEnabled = false;
        phet.phetio.phetioEngine.flushPhetioObjectBuffer();
        QUnit.start();
      } );
    }
    else {
      QUnit.start();
    }
  } );
};
export default qunitStart;