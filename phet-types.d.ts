/* eslint-disable */
// Copyright 2021, University of Colorado Boulder

/**
 * Ambient type declarations for PhET code.  Many of these definitions can be moved/disabled once the common code is
 * converted to TypeScript.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
declare var assert: undefined | ( ( x: any, s?: string ) => void );
declare var phet: any;

// Placeholder until we can use TypeScript in common code
type PhetioObjectOptions = {
  tandem?: Tandem,
  phetioDynamicElement?: boolean,
  phetioType?: IOType
};

type PaintDef = Paint | Color | string | Property<null | string | Color>;
type ColorDef = Color | string | null | Property<null | string | Color>;

// Placeholder until we can use TypeScript in common code
type NodeOptions = Partial<{

  children: any[], // TODO: importing Node in phet-types.d.ts creates a cycle.  We will need to separate files
  cursor: string | null,

  phetioVisiblePropertyInstrumented: boolean,
  visibleProperty: Property<boolean> | null,
  visible: boolean,

  pickableProperty: Property<boolean | null> | null,
  pickable: boolean | null,

  phetioEnabledPropertyInstrumented: boolean,
  enabledProperty: Property<boolean> | null,
  enabled: boolean,

  phetioInputEnabledPropertyInstrumented: boolean,
  inputEnabledProperty: Property<boolean> | null,
  inputEnabled: boolean,
  inputListeners: Array<Object>,
  opacity: number,
  disabledOpacity: number,
  filters: Array<Filter>,
  matrix: Matrix3,
  translation: Vector2,
  x: number,
  y: number,
  rotation: number,
  scale: number,
  excludeInvisibleChildrenFromBounds: boolean,
  layoutOptions: Object | null,
  localBounds: Bounds2 | null,
  maxWidth: number | null,
  maxHeight: number | null,
  leftTop: Vector2,
  centerTop: Vector2,
  rightTop: Vector2,
  leftCenter: Vector2,
  center: Vector2,
  rightCenter: Vector2,
  leftBottom: Vector2,
  centerBottom: Vector2,
  rightBottom: Vector2,
  left: number,
  right: number,
  top: number,
  bottom: number,
  centerX: number,
  centerY: number,
  renderer: string | null,
  layerSplit: boolean,
  usesOpacity: boolean,
  cssTransform: boolean,
  excludeInvisible: boolean,
  webglScale: number | null,
  preventFit: boolean,
  mouseArea: Bounds2 | Shape | null,
  touchArea: Bounds2 | Shape | null,
  clipArea: Shape | null,
  transformBounds: boolean,
}> & PhetioObjectOptions;

type PaintableOptions = {
  fill?: PaintDef;
  fillPickable?: boolean;
  stroke?: PaintDef;
  strokePickable?: boolean;
  lineWidth?: number;
  lineCap?: string;
  lineJoin?: string;
  miterLimit?: number;
  lineDash?: Array<number>;
  lineDashOffset?: number;
  cachedPaints?: PaintDef;
};

type PanelOptions = {
  fill: string | Color,
  stroke: string | Color,
  lineWidth: number,
  xMargin: number,
  yMargin: number,
  cornerRadius: number,
  resize: boolean,
  backgroundPickable: boolean,
  excludeInvisibleChildrenFromBounds: boolean,
  align: 'left' | 'right' | 'center',
  minWidth: number,
  tandem: Tandem
} & NodeOptions;

type ButtonNodeOptions = {
  content?: null,
  xMargin?: number,
  yMargin?: number,
  xAlign?: 'left' | 'right' | 'center',
  yAlign?: 'top' | 'bottom' | 'center',
  xContentOffset?: number,
  yContentOffset?: number,
  baseColor?: ColorDef,
  disabledColor?: ColorDef,
} & NodeOptions & PaintableOptions;

type RoundButtonOptions = {
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
} & ButtonNodeOptions;

type RoundPushButtonOptions = {
  soundPlayer: SoundClipPlayer,
  listener: () => void,
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

type ExpandCollapseButtonOptions = {} & RectangularToggleButtonOptions;

type SoundGeneratorOptions = {
  initialOutputLevel: number,
  audioContext: AudioContext,
  connectImmediately: boolean,
  enableControlProperties: Property<boolean>[],
  additionalAudioNodes: AudioNode[]
};

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

// Placeholder until we can use TypeScript in common code
type AccordionBoxOptions = {
  titleAlignX?: 'left' | 'right' | 'center',
  titleXSpacing?: number,

  titleNode?: Node,
  contentXMargin?: number,
  contentYMargin?: number,
  contentYSpacing?: number,
  cornerRadius?: number,
  buttonXMargin?: number,
  buttonYMargin?: number,
  expandCollapseButtonOptions?: ExpandCollapseButtonOptions,
} & NodeOptions;

type CheckboxOptions = {} & NodeOptions;

type QSMType = {
  getAll: ( a: any ) => any
};
declare var QueryStringMachine: QSMType;