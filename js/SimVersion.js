// Copyright 2019-2020, University of Colorado Boulder

/**
 * Handles serializing and deserializing versions for simulations.
 *
 **************************************************************
 * IMPORTANT NOTE: This file is copied from PERENNIAL to CHIPPER frequently. If this is in CHIPPER, then it is AUTO
 * GENERATED; do not edit, as it will be overwritten. Make sure that any change here is supported by usages of
 * CHIPPER's SimVersion (i.e. in JOIST/updateCheck.js), see https://github.com/phetsims/perennial/issues/111 for more
 **************************************************************
 *
 * See https://github.com/phetsims/chipper/issues/560 for discussion on version ID definition.
 *
 * The canonical description of our general versions:
 *
 * Each version string has the form: {{MAJOR}}.{{MINOR}}.{{MAINTENANCE}}[-{{TEST_TYPE}}.{{TEST_NUMBER}}] where:
 *
 * MAJOR: Sequential integer, starts at 1, and is generally incremented when there are significant changes to a simulation.
 * MINOR: Sequential integer, starts at 0, and is generally incremented when there are smaller changes to a simulation.
 *   Resets to 0 whenever the major number is incremented.
 * MAINTENANCE: Sequential integer, starts at 0, and is incremented whenever we build with the same major/minor (but with different SHAs).
 *   Resets to 0 whenever the minor number is incremented.
 * TEST_TYPE (when present): Indicates that this is a non-production build when present. Typically will take the values:
 *   'dev' - A normal dev deployment, which goes to phet-dev.colorado.edu/html/
 *   'rc' -  A release-candidate deployment (off of a release branch). Also goes to phet-dev.colorado.edu/html/ only.
 *   anything else - A one-off deployment name, which is the same name as the branch it was deployed from.
 * TEST_NUMBER (when present): Indicates the version of the test/one-off type (gets incremented for every deployment).
 *   starts at 0 in package.json, but since it is incremented on every deploy, the first version published will be 1.
 *
 * It used to be (pre-chipper-2.0) that sometimes a shortened form of the (non-'phet') brand would be added to the end
 * (e.g. '1.3.0-dev.1-phetio' or '1.3.0-dev.1-adaptedfromphet'), or as a direct prefix for the TEST_TYPE (e.g.
 * 1.1.0-phetiodev.1 or 1.1.0-phetio). We have since moved to a deployment model where there are
 * subdirectories for each brand, so this is no longer part of the version. Since this was not used for any production sim
 * builds that we need statistics from, it is excluded in SimVersion.js or its description.
 *
 * Examples:
 *
 * 1.5.0                - Production simulation version (no test type). Major = 1, minor = 5, maintenance = 0
 * 1.5.0-rc.1           - Example of a release-candidate build version that would be published before '1.5.0' for testing.
 * 1.5.0-dev.1          - Example of a dev build that would be from master.
 * 1.5.0-sonification.1 - Example of a one-off build (which would be from the branch 'sonification')
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

/* eslint-env browser, node */
'use strict';

// To support loading in Node.js and the browser
const assert = typeof module !== 'undefined' ? require( 'assert' ) : window && window.assert;

( function( global, assert ) {

  class SimVersion {
    /**
     * @constructor
     *
     * @param {number} major - The major part of the version (the 3 in 3.1.2)
     * @param {number} minor - The minor part of the version (the 1 in 3.1.2)
     * @param {number} maintenance - The maintenance part of the version (the 2 in 3.1.2)
     * @param {Object} options
     */
    constructor( major, minor, maintenance, options ) {
      const {
        // {string|null} - If provided, indicates the time at which the sim file was built
        buildTimestamp = null,

        // {string|null} - The test name, e.g. the 'rc' in rc.1. Also can be the one-off version name, if provided.
        testType = null,

        // {number|null} - The test number, e.g. the 1 in rc.1
        testNumber = null
      } = options || {};

      assert && assert( typeof major === 'number' && major >= 0 && major % 1 === 0, 'major version should be a non-negative integer' );
      assert && assert( typeof minor === 'number' && minor >= 0 && minor % 1 === 0, 'minor version should be a non-negative integer' );
      assert && assert( typeof maintenance === 'number' && maintenance >= 0 && maintenance % 1 === 0, 'maintenance version should be a non-negative integer' );
      assert && assert( typeof testType !== 'string' || typeof testNumber === 'number', 'if testType is provided, testNumber should be a number' );

      // @public {number}
      this.major = major;

      // @public {number}
      this.minor = minor;

      // @public {number}
      this.maintenance = maintenance;

      // @public {string|null}
      this.testType = testType;

      // @public {number|null}
      this.testNumber = testNumber;

      // @public {string|null} - If provided, like '2015-06-12 16:05:03 UTC' (phet.chipper.buildTimestamp)
      this.buildTimestamp = buildTimestamp;
    }

    /**
     * Convert into a plain JS object meant for JSON serialization.
     * @public
     *
     * @returns {Object}
     */
    serialize() {
      return {
        major: this.major,
        minor: this.minor,
        maintenance: this.maintenance,
        testType: this.testType,
        testNumber: this.testNumber,
        buildTimestamp: this.buildTimestamp
      };
    }

    /**
     * @returns {boolean}
     * @public
     */
    get isSimNotPublished() {
      return this.major < 1 || // e.g. 0.0.0-dev.1
             ( this.major === 1 && // e.g. 1.0.0-dev.1
               this.minor === 0 &&
               this.maintenance === 0 &&
               this.testType );
    }

    /**
     * Takes a serialized form of the SimVersion and returns an actual instance.
     * @public
     *
     * @param {Object}
     * @returns {SimVersion}
     */
    static deserialize( { major, minor, maintenance, testType, testNumber, buildTimestamp } ) {
      return new SimVersion( major, minor, maintenance, {
        testType: testType,
        testNumber: testNumber,
        buildTimestamp: buildTimestamp
      } );
    }

    /**
     * Compares versions, returning -1 if this version is before the passed in version, 0 if equal, or 1 if this version
     * is after.
     * @public
     *
     * This function only compares major/minor/maintenance, leaving other details to the client.
     *
     * @param {SimVersion} version
     */
    compareNumber( version ) {
      if ( this.major < version.major ) { return -1; }
      if ( this.major > version.major ) { return 1; }
      if ( this.minor < version.minor ) { return -1; }
      if ( this.minor > version.minor ) { return 1; }
      if ( this.maintenance < version.maintenance ) { return -1; }
      if ( this.maintenance > version.maintenance ) { return 1; }
      return 0; // equal
    }

    /**
     * Returns the string form of the version.
     * @public
     *
     * @returns {string}
     */
    toString() {
      let str = `${this.major}.${this.minor}.${this.maintenance}`;
      if ( typeof this.testType === 'string' ) {
        str += `-${this.testType}.${this.testNumber}`;
      }
      return str;
    }

    /**
     * Parses a sim version from a string form.
     * @public
     *
     * @param {string} versionString - e.g. '1.0.0', '1.0.1-dev.3', etc.
     * @param {string} [buildTimestamp] - Optional build timestamp, like '2015-06-12 16:05:03 UTC' (phet.chipper.buildTimestamp)
     * @returns {SimVersion}
     */
    static parse( versionString, buildTimestamp ) {
      const matches = versionString.match( /^(\d+)\.(\d+)\.(\d+)(-(([^.-]+)\.(\d+)))?(-([^.-]+))?$/ );

      if ( !matches ) {
        throw new Error( 'could not parse version: ' + versionString );
      }

      const major = parseInt( matches[ 1 ], 10 );
      const minor = parseInt( matches[ 2 ], 10 );
      const maintenance = parseInt( matches[ 3 ], 10 );
      const testType = matches[ 6 ];
      const testNumber = matches[ 7 ] === undefined ? matches[ 7 ] : parseInt( matches[ 7 ], 10 );

      return new SimVersion( major, minor, maintenance, {
        testType: testType,
        testNumber: testNumber,
        buildTimestamp: buildTimestamp
      } );
    }

    /**
     * Parses a branch in the form {{MAJOR}}.{{MINOR}} and returns a corresponding version. Uses 0 for the maintenance version (unknown).
     * @public
     *
     * @param {string} branch - e.g. '1.0'
     * @returns {SimVersion}
     */
    static fromBranch( branch ) {
      const bits = branch.split( '.' );
      assert && assert( bits.length === 2, `Bad branch, should be {{MAJOR}}.{{MINOR}}, had: ${branch}` );

      const major = parseInt( branch.split( '.' )[ 0 ], 10 );
      const minor = parseInt( branch.split( '.' )[ 1 ], 10 );

      return new SimVersion( major, minor, 0 );
    }

    /**
     * Ensures that a branch name is ok to be a release branch.
     * @public
     *
     * @param {string} branch - e.g. '1.0'
     */
    static ensureReleaseBranch( branch ) {
      const version = SimVersion.fromBranch( branch );
      assert && assert( version.major > 0, 'Major version for a branch should be greater than zero' );
      assert && assert( version.minor >= 0, 'Minor version for a branch should be greater than (or equal) to zero' );
    }
  }

  // Node.js-compatible definition
  if ( typeof module !== 'undefined' ) {
    module.exports = SimVersion;
  }
  else {

    // Browser support, assign with
    window.phet = window.phet || {};
    window.phet.preloads = window.phet.preloads || {};
    window.phet.preloads.chipper = window.phet.preloads.chipper || {};
    window.phet.preloads.chipper.SimVersion = SimVersion;
  }
} )( ( 1, eval )( 'this' ), assert );
// Indirect eval usage done since babel likes to wrap things in strict mode.
// See http://perfectionkills.com/unnecessarily-comprehensive-look-into-a-rather-insignificant-issue-of-global-objects-creation/#ecmascript_5_strict_mode
