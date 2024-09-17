// Copyright 2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

// Use nopt to guarantee compatibility with grunt. See usage site: https://github.com/phetsims/chipper/issues/1459
// See usage in chipper/node_modules/grunt-cli/bin/grunt
// @ts-expect-error
import nopt from 'nopt';
import IntentionalAny from '../../../../../phet-core/js/types/IntentionalAny.js';

const options = nopt( {}, {}, process.argv, 2 );

function getOption( keyName: string ): IntentionalAny {
  return options[ keyName ];
}

export default getOption;