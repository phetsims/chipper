/* eslint-disable */
window.isPhetio = true;

import './phet.js';

// TODO: See https://github.com/phetsims/chipper/issues/857
if ( window.isPhetio ) {
  // /* webpackMode: "eager" */
  import(   './phetio/phetio.js').then( m => {
  } );
}
