// Copyright 2024, University of Colorado Boulder

/**
 * Type alias for the Grunt object, which is a global object in Grunt tasks.
 *
 * TODO: try to get types from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/grunt/index.d.ts, see https://github.com/phetsims/chipper/issues/1459
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';

type TGrunt = {
  file: {
    read( file: IntentionalAny ): IntentionalAny;
    expand( arg0: { filter: string; cwd: string }, arg1: string[] ): string[]; readJSON: ( path: string ) => Record<string, IntentionalAny>; exists: ( path: string ) => boolean; delete: ( path: string ) => void; mkdir: ( path: string ) => void; write: ( path: string, content: string ) => void; recurse: ( path: string, callback: ( path: string ) => void ) => void;
  };
  option: ( key: string ) => string | number | boolean;
  registerTask: ( name: string, description: string, task: ( () => void ) | string[] ) => void;
  log: {
    write( arg0: string ): void;
    error( arg0: string ): void;
    debug( arg0: string ): unknown; writeln: ( message: string ) => void;
  };
  fail: { fatal: ( message: string ) => void };
  task: {
    run( arg0: string ): unknown; current: { async: () => ( () => void ) };
  };
};

export default TGrunt;