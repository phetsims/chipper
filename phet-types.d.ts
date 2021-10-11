/* eslint-disable */

/**
 * Ambient type declarations for PhET code
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
declare var assert: undefined | ( ( x: any, s?: string ) => void );
declare var phet: any;

// Placeholder for scenery node options
declare type NodeOptions = {};

class ObservableArray<T> extends Array<T> {
  count( predicate: ( t: T ) => boolean ):number {
  }

  addItemRemovedListener( listener: ( item: T ) => void ) {
  }

  addItemAddedListener( listener: ( item: T ) => void ) {}

  add( t: T ) {}

  remove( t: T ) {}

  clear() {}
}