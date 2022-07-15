// Copyright 2021, University of Colorado Boulder

/* eslint-disable no-unused-vars, no-var */

/**
 * Ambient type declarations for PhET code.  Many of these definitions can be moved/disabled once the common code is
 * converted to TypeScript.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

declare var assert: undefined | ( ( x: any, ...messages?: any[] ) => void );
declare var assertSlow: undefined | ( ( x: any, ...messages?: any[] ) => void );
declare var sceneryLog: undefined | any;
declare var phet: any;

// TODO: This can be moved to QueryStringMachine when it is moved to TypeScript, see https://github.com/phetsims/query-string-machine/issues/49
declare type Warning = {
  key: string;
  value: string;
};

declare var QueryStringMachine: {
  getAll: ( a: any ) => any;
  get: ( a: string, schema: any ) => any;
  containsKey: ( key: string ) => boolean;
  warnings: Warning[];
  addWarning: ( key: string, value: boolean | object | number, message: string ) => void;
  removeKeyValuePair: ( key: string, value: boolean | object | number | string ) => string;
  removeKeyValuePairs: ( key: string, value: ( boolean | object | number | string )[] ) => string;
  appendQueryString: ( url: string, tail: string ) => string;
  getForString: ( s: string, schema: any, s: string ) => string;
  getQueryString: ( url: string ) => string;
};

// globals used in Sim.ts
declare var phetSplashScreenDownloadComplete: () => void;
declare var TWEEN: { update: ( dt: number ) => void };
declare var phetSplashScreen: { dispose: () => void };
declare var phetio: any;

declare var assertions: {
  enableAssert: () => void;
};

// Experiment to allow accessing these off window. See https://stackoverflow.com/questions/12709074/how-do-you-explicitly-set-a-new-property-on-window-in-typescript
declare global {
  interface Window {
    phet: any;
    phetio: any;
  }
}