// Copyright 2022-2024, University of Colorado Boulder

/**
 * Cache the results of processes so that they don't need to be re-run if there have been no changes.
 * For instance, this can speed up unit tests and phet-io-api-compare. This streamlines the precommit hooks
 * by avoiding duplicated work.
 *
 * The CacheLayer only works if the watch process is checking for changed files.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
import fs from 'fs';

const readCacheLayerJSON = () => {
  try {
    return JSON.parse( fs.readFileSync( '../chipper/dist/cache-layer.json', 'utf-8' ) );
  }
  catch( e ) {
    return {};
  }
};

const LATEST_CHANGE_TIMESTAMP_KEY = 'latestChangeTimestamp';

const writeFileAsJSON = ( json: object ) => {
  fs.writeFileSync( '../chipper/dist/cache-layer.json', JSON.stringify( json, null, 2 ) );
};

export default {

  // When the watch process exits, invalidate the caches until the watch process resumes
  clearLastChangedTimestamp(): void {
    const json = readCacheLayerJSON();
    delete json[ LATEST_CHANGE_TIMESTAMP_KEY ];
    writeFileAsJSON( json );
  },

  // Invalidate caches when a relevant file changes
  updateLastChangedTimestamp(): void {
    const json = readCacheLayerJSON();
    json[ LATEST_CHANGE_TIMESTAMP_KEY ] = Date.now();
    writeFileAsJSON( json );
  },

  // When a process succeeds, save the timestamp
  onSuccess( keyName: string ): void {
    const json = readCacheLayerJSON();
    json.cache = json.cache || {};
    json.cache[ keyName ] = Date.now();
    writeFileAsJSON( json );
  },

  // Check whether we need to re-run a process
  isCacheStale( keyName: string ): boolean {
    return !this.isCacheSafe( keyName );
  },

  isCacheSafe( keyName: string ): boolean {
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