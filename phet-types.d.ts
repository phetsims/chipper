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

declare var QueryStringMachine: {
  getAll: ( a: any ) => any;
  containsKey: ( key: string ) => boolean;
  warnings: string[];
  addWarning: ( key: string, value: boolean | object | number, message: string ) => void;
  removeKeyValuePair: ( key: string, value: boolean | object | number | string ) => string;
  appendQueryString: ( url: string, tail: string ) => string;
  getForString: ( s: string, schema: any, s: string ) => string;
};

// globals used in Sim.ts
declare var phetSplashScreenDownloadComplete: () => void;
declare var TWEEN: { update: ( dt: number ) => void };
declare var phetSplashScreen: { dispose: () => void };
declare var phetio: any;