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

// TODO: See https://github.com/phetsims/chipper/issues/1549
// const LATEST_CHANGE_TIMESTAMP_KEY = 'latestChangeTimestamp';

const writeFileAsJSON = ( json: object ) => {
  fs.writeFileSync( '../chipper/dist/cache-layer.json', JSON.stringify( json, null, 2 ) );
};

export default {

  // When a process succeeds, save the timestamp
  onSuccess( keyName: string ): void {
    const json = readCacheLayerJSON();
    json.cache = json.cache || {};
    json.cache[ keyName ] = Date.now();
    writeFileAsJSON( json );
  },

  isCacheSafe( keyName: string ): boolean {

    // TODO: https://github.com/phetsims/chipper/issues/1549 The cache no longer knows how to invalidate since we switched to SWC transpiler.
    // Therefore, to be safe, there is never a cache hit.
    // There are some ideas in https://github.com/phetsims/chipper/issues/1549 about how to hash the dependencies for caching,
    // or to use a "timeout", like "if it succeeded within the last N minutes, it is probably fine".
    return false;

    // TODO: Sample usage in case we leverage the cache file in the future, see https://github.com/phetsims/chipper/issues/1549
    // const json = readCacheLayerJSON();
    // const time = json.cache && json.cache[ keyName ];
    // const lastChanged = json[ LATEST_CHANGE_TIMESTAMP_KEY ];
    // if ( typeof time === 'number' && typeof lastChanged === 'number' && lastChanged < time ) {
    //   return true;
    // }
    // else {
    //   return false;
    // }
  }
};