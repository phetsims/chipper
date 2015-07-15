// Copyright 2002-2015, University of Colorado Boulder

/**
 * Some 3rd party dependencies, such as Tween.js include dependencies that are covered under a different
 * copyright/license.  For the case of Tween.js (MIT), it includes the easing equations from Penner (Revised BSD)
 * This task runs during setThirdPartyLicenses and errors out if the dependent licenses are not
 * included in the licenseKeys from package.json
 *
 * @author Sam Reid
 */

/**
 * @param grunt the grunt instance
 * @param {Object} pkg package.json
 */
module.exports = function( grunt, pkg ) {
  'use strict';

  // If the simulation contains tween-r12 it must also have easing-equations in order to 
  // include the additional Revised BSD license for the easing equations
  var preload = pkg.preload;
  var containsTween = false;
  for ( var i = 0; i < preload.length; i++ ) {
    if ( preload[ i ].indexOf( 'Tween-r12.js' ) >= 0 ) {
      containsTween = true;
      break;
    }
  }
  if ( containsTween ) {
    var containsEasingEquations = false;
    if ( pkg.licenseKeys ) {
      for ( i = 0; i < pkg.licenseKeys.length; i++ ) {
        if ( pkg.licenseKeys[ i ].indexOf( 'easing-equations' ) >= 0 ) {
          containsEasingEquations = true;
          break;
        }
      }
    }

    // If tween was included but easing-equations wasn't, there is an error that should stop the build
    // so that we can guarantee that the simulation will be built with all of the appropriate licenses.
    if ( !containsEasingEquations ) {
      grunt.fail.warn( 'Missing easing equations, add "easing-equations" to pkg.preload' );
    }
  }
};
