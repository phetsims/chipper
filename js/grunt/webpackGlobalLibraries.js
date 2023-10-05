// Copyright 2023, University of Colorado Boulder

/**
 * webpackGlobalLibraries defined the third party library files that load with a global.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */


// TODO: regex is less than ideal here, but Rule.test is a bit finicky, see https://github.com/phetsims/chipper/issues/1409
module.exports = {
  peggy: /sherpa[\\/]lib[\\/]peggy-3\.0\.2\.js$/, // `sherpa/lib/peggy-3.0.2.js` with windows path support
  himalaya: /sherpa[\\/]lib[\\/]himalaya-1\.1\.0\.js$/ // `sherpa/lib/himalaya-1.1.0.js` with windows path support
};
