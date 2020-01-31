/* eslint-disable */
window.isPhetio = true;
window.isPhetio = false;
if ( window.isPhetio ) {

  import(   /* webpackMode: "eager" */ './phetio/phetio.js').then( m => {
    console.log( 'io', m.default );
  } );
}
else {
  import(   /* webpackMode: "eager" */ './phet.js').then( m => {
    console.log( 'phet', m.default );
  } );
}