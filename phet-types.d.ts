// Copyright 2021, University of Colorado Boulder

/* eslint-disable no-var */

/**
 * Ambient type declarations for PhET code.  Many of these definitions can be moved/disabled once the common code is
 * converted to TypeScript. Note that this file is in globals mode, so the `declare var` statements will be available
 * as globals like `phetio` and also as properties on the `window` object like `window.phetio`.
 *
 * See also phet-types-module.d.ts which is in module mode.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// Can't externally reference
type IntentionalAny = any;

declare var assert: undefined | ( ( x: IntentionalAny, ...messages?: IntentionalAny[] ) => void );
declare var assertSlow: undefined | ( ( x: IntentionalAny, ...messages?: IntentionalAny[] ) => void );
declare var sceneryLog: null | false | ( Record<string, ( ob: IntentionalAny, style?: string ) => void> & {
  push(): void;
  pop(): void;
  getDepth(): number;
} );
declare var phet: Record<string, IntentionalAny>;

// TODO: This can be moved to QueryStringMachine when it is moved to TypeScript, see https://github.com/phetsims/query-string-machine/issues/49
declare type Warning = {
  key: string;
  value: string;
};

// Matches TYPE documentation in QueryStringMachine
declare type QueryStringMachineSchema = {
  private?: boolean;
  public?: boolean;
} & (
  {
    type: 'flag';
  } |
  {
    type: 'boolean';
    defaultValue?: boolean;
  } |
  {
    type: 'number';
    defaultValue?: number;
    validValues?: readonly number[];
    isValidValue?: ( n: number ) => boolean;
  } |
  {
    type: 'string';
    defaultValue?: string | null;
    validValues?: readonly ( string | null )[];
    isValidValue?: ( n: string | null ) => boolean;
  } |
  {
    type: 'array';
    elementSchema: QueryStringMachineSchema;
    separator?: string;
    defaultValue?: null | readonly IntentionalAny[];
    validValues?: readonly IntentionalAny[][];
    isValidValue?: ( n: IntentionalAny[] ) => boolean;
  } |
  {
    type: 'custom';
    parse: ( str: string ) => IntentionalAny;
    defaultValue?: IntentionalAny;
    validValues?: readonly IntentionalAny[];
    isValidValue?: ( n: IntentionalAny ) => boolean;
  } );

// Converts a Schema's type to the actual Typescript type it represents
declare type QueryMachineTypeToType<T> = T extends ( 'flag' | 'boolean' ) ? boolean : ( T extends 'number' ? number : ( T extends 'string' ? ( string | null ) : ( T extends 'array' ? IntentionalAny[] : IntentionalAny ) ) );

type QSMSchemaObject = Record<string, QueryStringMachineSchema>;

declare type QSMParsedParameters<SchemaMap extends QSMSchemaObject> = {
  // Will return a map of the "result" types
  [Property in keyof SchemaMap]: QueryMachineTypeToType<SchemaMap[ Property ][ 'type' ]>
  // SCHEMA_MAP allowed to be set in types
} & { SCHEMA_MAP?: QSMSchemaObject };

declare var QueryStringMachine: {
  getAll: <SchemaMap extends QSMSchemaObject>( a: SchemaMap ) => QSMParsedParameters<SchemaMap>;
  getAllForString: <SchemaMap extends QSMSchemaObject>( a: SchemaMap, b: string ) => QSMParsedParameters<SchemaMap>;

  get: <Schema extends QueryStringMachineSchema>( a: string, schema: Schema ) => QueryMachineTypeToType<Schema[ 'type' ]>;
  containsKey: ( key: string ) => boolean;
  warnings: Warning[];
  addWarning: ( key: string, value: IntentionalAny, message: string ) => void;
  removeKeyValuePair: ( queryString: string, key: string ) => string;
  removeKeyValuePairs: ( queryString: string, keys: string[] ) => string;
  appendQueryString: ( url: string, tail: string ) => string;
  getForString: ( s: string, schema: QueryStringMachineSchema, s: string ) => string;
  getQueryString: ( url: string ) => string;
  containsKeyForString: ( key: string, s: string ) => boolean;
  getSingleQueryParameterString: ( key: string, url: string ) => string | null;
  getQueryParametersFromString: ( string: string ) => string[];
};

// globals used in Sim.ts
declare var phetSplashScreenDownloadComplete: () => void;
declare var TWEEN: { update: ( dt: number ) => void };
declare var phetSplashScreen: { dispose: () => void };
declare var phetio: Record<string, IntentionalAny>;

// Typing for linebreaker-1.1.0.js preload
declare type LineBreakerBreak = {
  position: number;
  required: boolean;
};
declare type LineBreakerType = {
  nextBreak(): LineBreakerBreak | null;

  // We make it iterable
  [ Symbol.iterator ](): Iterator<LineBreakerBreak, undefined>;
};
declare var LineBreaker: {
  new( str: string ): LineBreakerType;
};

declare var assertions: {
  enableAssert: () => void;
  assertionHooks: Array<() => void>;
};

// Experiment to allow accessing these off window. See https://stackoverflow.com/questions/12709074/how-do-you-explicitly-set-a-new-property-on-window-in-typescript
declare global {
  interface Window { // eslint-disable-line @typescript-eslint/consistent-type-definitions
    phet: typeof phet;
    phetio: typeof phetio;
  }
}

// Adapted from https://github.com/mourner/flatqueue/blob/main/index.d.ts
declare class FlatQueue<T> {
  public readonly length: number;

  public constructor();

  public clear(): void;

  public push( item: T, priority: number ): void;

  public pop(): T | undefined;

  public peek(): T | undefined;

  public peekValue(): number | undefined;

  public shrink(): void;
}