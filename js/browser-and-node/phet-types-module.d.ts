// Copyright 2025, University of Colorado Boulder

/**
 * Ambient type declarations for PhET code that requires import statements. Please note this type declaration file is in
 * module model, unlike phet-types.d.ts which is in globals mode.  We cannot use globals mode here because we must import
 * lodash.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import * as lodash from 'lodash';
import { QueryStringMachine as QueryStringMachineModule } from '../../../query-string-machine/js/QueryStringMachineModule.js';

declare global {

  // Specify the correct type for lodash as a global object to work around the TS2686 warning in WebStorm/IntelliJ
  // See https://github.com/phetsims/chipper/issues/1402
  const _: typeof lodash;

  const QueryStringMachine: typeof QueryStringMachineModule;

  interface Window { // eslint-disable-line @typescript-eslint/consistent-type-definitions
    _: typeof lodash;
    QueryStringMachine: typeof QueryStringMachineModule;
  }
}