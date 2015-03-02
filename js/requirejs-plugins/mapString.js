// Copyright 2002-2015, University of Colorado Boulder

/**
 * Maps an input string to a final string, accommodating tricks like doubleStrings above
 * @param string - the string to be mapped
 * @param stringTest - the value of the stringTest query parameter
 * @returns {*}
 */
(function() {
  'use strict';

  var mapString = function( string, stringTest ) {
    return stringTest === null ? string :
           stringTest === 'double' ? string + ':' + string :
           stringTest === 'empty' ? '' :
           stringTest === 'none' ? string :

             //In the fallback case, supply whatever string was given in the query parameter value
           stringTest;
  };
  if ( typeof module !== 'undefined' ) {
    module.exports = mapString;
  }
  else {
    define( function() {
      return mapString;
    } );
  }
})();
