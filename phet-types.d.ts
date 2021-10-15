/* eslint-disable */

/**
 * Ambient type declarations for PhET code
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
declare var assert: undefined | ( ( x: any, s?: string ) => void );
declare var phet: any;

// Placeholder for scenery node options until we can use TypeScript in common code
declare type NodeOptions = {

  children: Node[],
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
};

// Placeholder until we can use TypeScript in common code
class ObservableArray<T> extends Array<T> {
  lengthProperty: Property<number>;

  removeAll( elements: T[] ) {
  }

  count( predicate: ( t: T ) => boolean ): number {
  }

  addItemRemovedListener( listener: ( item: T ) => void ) {
  }

  addItemAddedListener( listener: ( item: T ) => void ) {}

  add( t: T ) {}

  remove( t: T ) {}

  clear() {}
}

// Placeholder until we can use TypeScript in common code
type PhetioObjectOptions = {
  tandem: Tandem,
  phetioDynamicElement: boolean,
  phetioType: IOType
};

// Placeholder until we can use TypeScript in common code
type AccordionBoxOptions = {
  titleAlignX: 'left' | 'right' | 'center',
  titleXSpacing: number
};