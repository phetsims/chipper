// Copyright 2021, University of Colorado Boulder

/**
 * Ambient type declarations for PhET code.  Many of these definitions can be moved/disabled once the common code is
 * converted to TypeScript.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

declare var assert: undefined | ( ( x: any, s?: string ) => void ); // eslint-disable-line no-unused-vars, no-var
declare var assertSlow: undefined | ( ( x: any, s?: string ) => void ); // eslint-disable-line no-unused-vars, no-var
declare var sceneryLog: undefined | any; // eslint-disable-line no-unused-vars, no-var
declare var phet: any; // eslint-disable-line no-unused-vars, no-var

declare var QueryStringMachine: { // eslint-disable-line no-unused-vars, no-var
  getAll: ( a: any ) => any;
  containsKey: ( key: string ) => boolean;
  warnings: string[];
  addWarning: ( key: string, value: boolean | object | number, message: string ) => void;
};

// globals used in Sim.ts
declare var phetSplashScreenDownloadComplete: () => void; // eslint-disable-line no-unused-vars, no-var
declare var TWEEN: { update: ( dt: number ) => void };  // eslint-disable-line no-unused-vars, no-var
declare var phetSplashScreen: { dispose: () => void };  // eslint-disable-line no-unused-vars, no-var
declare var phetio: any; // eslint-disable-line no-unused-vars, no-var