// Copyright 2025, University of Colorado Boulder

/* eslint-disable phet/default-export-class-should-register-namespace */

/**
 * An entry point for the Fluent library. In the browser-and-node directory, it lets Fluent be used by
 * both simulation code and during the grunt modulify process. Follow tsconfig-dependencies.json to see
 * how Fluent code is referenced for typescript. See the README in the sherpa/lib/fluent directory
 * for more information on how Fluent is set up for PhET simulations.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import { Pattern } from '../../../sherpa/lib/fluent/fluent-bundle-0.18.0/src/ast.js';
import { FluentBundle } from '../../../sherpa/lib/fluent/fluent-bundle-0.18.0/src/bundle.js';
import { FluentResource } from '../../../sherpa/lib/fluent/fluent-bundle-0.18.0/src/resource.js';
import { FluentParser } from '../../../sherpa/lib/fluent/fluent-syntax-0.19.0/src/parser.js';

class FluentLibrary {

  /**
   * Gets all message keys (excluding terms) from a Fluent file string. This exists in
   * FluentLiberary (instead of FluentUtils) because it needs to be used outside of simulation
   * code.
   */
  public static getFluentMessageKeys( fluentFileString: string ): string[] {
    const parser = new FluentParser();
    const resource = parser.parse( fluentFileString );

    const keys = resource.body
      .filter( entry => entry.type === 'Message' )
      .map( entry => entry.id.name );

    return keys;
  }
}

export default FluentLibrary;
export { FluentBundle, FluentResource };
export type { Pattern };