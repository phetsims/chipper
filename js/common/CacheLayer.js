// Copyright 2022-2023, University of Colorado Boulder

/**
 * Cache the results of processes so that they don't need to be re-run if there have been no changes.
 * For instance, this can speed up tsc, lint and unit tests. This also streamlines the precommit hooks
 * by avoiding duplicated work.
 *
 * The CacheLayer only works if the watch process is checking for changed files.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

const fs = require( 'fs' );

const readCacheLayerJSON = () => {
  try {
    return JSON.parse( fs.readFileSync( '../chipper/dist/cache-layer.json' ) );
  }
  catch( e ) {
    return {};
  }
};

const LATEST_CHANGE_TIMESTAMP_KEY = 'latestChangeTimestamp';

const writeFileAsJSON = json => {
  fs.writeFileSync( '../chipper/dist/cache-layer.json', JSON.stringify( json, null, 2 ) );
};

module.exports = {

  // When the watch process exits, invalidate the caches until the watch process resumes
  clearLastChangedTimestamp() {
    const json = readCacheLayerJSON();
    delete json[ LATEST_CHANGE_TIMESTAMP_KEY ];
    writeFileAsJSON( json );
  },

  // Invalidate caches when a relevant file changes
  updateLastChangedTimestamp() {
    const json = readCacheLayerJSON();
    json[ LATEST_CHANGE_TIMESTAMP_KEY ] = Date.now();
    writeFileAsJSON( json );
  },

  // When a process succeeds, save the timestamp
  onSuccess( keyName ) {
    const json = readCacheLayerJSON();
    json.cache = json.cache || {};
    json.cache[ keyName ] = Date.now();
    writeFileAsJSON( json );
  },

  // Check whether we need to re-run a process
  isCacheStale( keyName ) {
    return !this.isCacheSafe( keyName );
  },

  /**
   * @param {string} keyName
   * @returns {boolean} - true if a cache hit
   */
  isCacheSafe( keyName ) {
    const json = readCacheLayerJSON();
    const time = json.cache && json.cache[ keyName ];
    const lastChanged = json[ LATEST_CHANGE_TIMESTAMP_KEY ];
    if ( typeof time === 'number' && typeof lastChanged === 'number' && lastChanged < time ) {
      return true;
    }
    else {
      return false;
    }
  }
};