// Copyright 2015-2020, University of Colorado Boulder

/**
 * Report which translatable strings from a sim were not used in the simulation with a require statement.
 *
 * Each time a string is loaded by the plugin, it is added to a global list.  After all strings are loaded,
 * the global will contain the list of all strings that are actually used by the sim.  Comparing this list to
 * the strings in the translatable strings JSON file will identify which strings are unused.
 *
 * See https://github.com/phetsims/tasks/issues/460
 *
 * @author Jesse Greenberg
 */

'use strict';

const grunt = require( 'grunt' );

/**
 * @param {string} repo
 * @param {string} requirejsNamespace
 * @param {Object} usedStringMap - Maps full keys to string values, FOR USED STRINGS ONLY
 */
module.exports = function( repo, requirejsNamespace, usedStringMap ) {

  /**
   * Builds a string map recursively from a string-file-like object.
   *
   * @param {Object} object
   * @returns {Object}
   */
  const buildStringMap = object => {
    const result = {};

    if ( typeof object.value === 'string' ) {
      result[ '' ] = object.value;
    }
    Object.keys( object ).filter( key => key !== 'value' ).forEach( key => {
      if ( typeof object[ key ] === 'object' ) {
        const subresult = buildStringMap( object[ key ] );

        Object.keys( subresult ).forEach( subkey => {
          result[ key + ( subkey.length ? `.${subkey}` : '' ) ] = subresult[ subkey ];
        } );
      }
    } );

    return result;
  };

  const availableStringMap = buildStringMap( grunt.file.readJSON( `../${repo}/${repo}-strings_en.json` ) );

  Object.keys( availableStringMap ).forEach( availableStringKey => {
    if ( !usedStringMap[ `${requirejsNamespace}/${availableStringKey}` ] ) {
      grunt.log.warn( `Unused string: key=${availableStringKey}, value=${availableStringMap[ availableStringKey ]}` );
    }
  } );
};