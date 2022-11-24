// Copyright 2013-2019, University of Colorado Boulder

define( function() {
  'use strict';

  return function( name, parentRequire ) {
    //trim the ? suffix, resolve on the last / (could later be converted to :)
    const url = parentRequire.toUrl( name.substring( 0, name.indexOf( '/' ) ) );

    return (url.indexOf( '?' ) >= 0 ? url.substring( 0, url.indexOf( '?' ) ) : url) + '/../';
  };
} );