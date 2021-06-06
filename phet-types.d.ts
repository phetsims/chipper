/* eslint-disable */

// import Tandem from "../../../tandem/js/Tandem";

declare var assert: undefined | ( ( x: boolean, s?: string ) => void );
declare var phet: any;
declare var phetio: any;
declare var _: any;
declare var assertSlow: any;
declare var sceneryLog: any;
declare var scenery: any;
// declare var Enumeration: any;
declare var QUnit: any;

declare var module: any

declare interface PhetioObject {
  greeting: string;
  duration?: number;
  color?: string;
  // tandem: Tandem;
}

declare interface Enumeration {
  NOTIFY: string;
  IDENTITY: string;
}