// Copyright 2021, University of Colorado Boulder
/* eslint-disable */
// @ts-nocheck

/**
 * Ambient type declarations for PhET code.  Many of these definitions can be moved/disabled once the common code is
 * converted to TypeScript.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// See https://stackoverflow.com/a/51114250/3408502
NodeOptions = import('../scenery/js/Node.ts').NodeOptions;
RoundButtonOptions = import('../sun/buttons/RoundButton.ts').RoundButtonOptions;
SoundGeneratorOptions = import('../tambo/js/sound-generators/SoundGenerator.ts').SoundGeneratorOptions;

declare var assert: undefined | ( ( x: any, s?: string ) => void );
declare var assertSlow: undefined | ( ( x: any, s?: string ) => void );
declare var sceneryLog: undefined | any;
declare var phet: any;

type RoundPushButtonOptions = {
  soundPlayer?: SoundClipPlayer,
  listener?: () => void,
} & RoundButtonOptions;

type SoundClipOptions = {
  loop?: boolean,
  trimSilence?: boolean,
  initialPlaybackRate?: number,
  initiateWhenDisabled?: boolean,
  rateChangesAffectPlayingSounds?: boolean
} & SoundGeneratorOptions;

type QSMType = {
  getAll: ( a: any ) => any,
  containsKey: ( key: string ) => boolean
};

declare var QueryStringMachine: QSMType;