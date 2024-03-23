// Copyright 2015-2024, University of Colorado Boulder

/**
 * Constants used throughout chipper.
 * All fields are @public (read-only)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

/* eslint-env node */


const ChipperConstants = {

  // Locale to use when no locale is specified
  FALLBACK_LOCALE: 'en',

  // Media types, also the directory names where the media files live
  MEDIA_TYPES: [ 'sounds', 'images', 'mipmaps' ],

  // Used to fill in sim.html, the sim template
  START_THIRD_PARTY_LICENSE_ENTRIES: '### START THIRD PARTY LICENSE ENTRIES ###',

  // Used to fill in sim.html, the sim template
  END_THIRD_PARTY_LICENSE_ENTRIES: '### END THIRD PARTY LICENSE ENTRIES ###',

  // (a11y) tail suffix of the a11y-view template. Expected usage: {{repository-name}}{{A11Y_VIEW_HTML_SUFFIX}}
  A11Y_VIEW_HTML_SUFFIX: '_a11y_view.html',

  // All brands that should be taken into account for dependency handling
  BRANDS: [ 'phet', 'phet-io', 'adapted-from-phet' ],

  // Where temporary build output will go in chipper, see https://github.com/phetsims/chipper/issues/900
  BUILD_DIR: 'build'
};

module.exports = ChipperConstants;