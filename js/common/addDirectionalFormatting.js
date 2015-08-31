// Copyright 2002-2015, University of Colorado Boulder

/**
 * Pad LTR/RTL language values with unicode embedding marks (see https://github.com/phetsims/joist/issues/152)
 * Uses directional formatting characters: http://unicode.org/reports/tr9/#Directional_Formatting_Characters
 *
 * @author Aaron Davis
 */
(function() {
  'use strict';

  /**
   * @param {Object} stringData
   * @param {boolean} isRTL
   */
  var addDirectionalFormatting = function( stringData, isRTL ) {
    stringData.value = ( isRTL ? '\u202b' : '\u202a' ) + stringData.value + '\u202c';
  };

  // browser require.js-compatible definition
  if ( typeof define !== 'undefined' ) {
    define( function() {
      return addDirectionalFormatting;
    } );
  }

  // Node.js-compatible definition
  if ( typeof module !== 'undefined' ) {
    module.exports = addDirectionalFormatting;
  }

})();

