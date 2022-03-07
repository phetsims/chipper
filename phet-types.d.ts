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
TAlertableDef = import('../utterance-queue/js/AlertableDef.ts').TAlertableDef;

declare var assert: undefined | ( ( x: any, s?: string ) => void );
declare var assertSlow: undefined | ( ( x: any, s?: string ) => void );
declare var sceneryLog: undefined | any;
declare var phet: any;

type ThermometerNodeOptions = Partial<{
  bulbDiameter: number,
  tubeWidth: number,
  tubeHeight: number,
  lineWidth: number,
  outlineStroke: ColorDef,
  tickSpacing: number,
  tickSpacingTemperature: number | null,
  majorTickLength: number,
  minorTickLength: number,
  glassThickness: number,
  zeroLevel: string,
  backgroundFill: ColorDef,
  fluidMainColor: ColorDef,
  fluidHighlightColor: ColorDef,
  fluidRightSideColor: ColorDef,
  tandem: Tandem
}> & NodeOptions;

type RoundButtonOptions = Partial<{
  content: any,
  radius: number,
  cursor: string,
  fireOnDown: boolean,
  touchAreaDilation: number,
  mouseAreaDilation: number,
  touchAreaXShift: number,
  touchAreaYShift: number,
  mouseAreaXShift: number,
  mouseAreaYShift: number,
  stroke: undefined | string | Color,
  lineWidth: number,
}> & ButtonNodeOptions;

type RoundPushButtonOptions = {
  soundPlayer?: SoundClipPlayer,
  listener?: () => void,
} & RoundButtonOptions;

type RectangularToggleButtonOptions = {
  content?: null | Node;
  size?: Dimension2;
  minWidth?: number;
  minHeight?: number;
  touchAreaXDilation?: number;
  touchAreaYDilation?: number;
  mouseAreaXDilation?: number;
  mouseAreaYDilation?: number;
  touchAreaXShift?: number;
  touchAreaYShift?: number;
  mouseAreaXShift?: number;
  mouseAreaYShift?: number;
  cornerRadius?: number;
  leftTopCornerRadius?: number | null;
  rightTopCornerRadius?: number | null;
  leftBottomCornerRadius?: number | null;
  rightBottomCornerRadius?: number | null;
} & ButtonNodeOptions;

type ExpandCollapseButtonOptions = RectangularToggleButtonOptions;

type SoundClipOptions = {
  loop?: boolean,
  trimSilence?: boolean,
  initialPlaybackRate?: number,
  initiateWhenDisabled?: boolean,
  rateChangesAffectPlayingSounds?: boolean
} & SoundGeneratorOptions;

// Placeholder until we can use TypeScript in common code
class ObservableArray<T> extends Array<T> {
  lengthProperty: Property<number>;

  removeAll( elements: T[] ) {
  }

  count( predicate: ( t: T ) => boolean ): number {
  }

  addItemRemovedListener( listener: ( item: T ) => void ) {}

  addItemAddedListener( listener: ( item: T ) => void ) {}

  removeItemRemovedListener( listener: ( item: T ) => void ) {}

  removeItemAddedListener( listener: ( item: T ) => void ) {}

  add( t: T ) {}

  remove( t: T ) {}

  clear() {}
}

type CheckboxOptions = {
  checkedContextResponse?: TAlertableDef | null,
  uncheckedContextResponse?: TAlertableDef | null
} & NodeOptions;

type QSMType = {
  getAll: ( a: any ) => any,
  containsKey: ( key: string ) => boolean
};

type AlerterOptions = {
  alertToVoicing?: boolean;
  descriptionAlertNode?: any;
};

declare var QueryStringMachine: QSMType;