// Copyright 2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

// TODO: Replace with nopt 4.0.1 to guarantee compatibility with grunt. See usage site: https://github.com/phetsims/chipper/issues/1459
// /Users/samreid/phet/root/chipper/node_modules/grunt-cli/bin/grunt
module.exports = function( grunt ) {
  function parseArgs( argv ) {
    const args = {};
    argv.forEach( ( arg, index ) => {
      if ( arg.startsWith( '--' ) ) {
        // Check if argument uses '--key=value' format
        const [ key, value ] = arg.includes( '=' )
                               ? arg.slice( 2 ).split( '=' )  // Split on '=' to separate key and value
                               : [ arg.slice( 2 ), null ];    // If no '=', key is arg and value is null

        // If value is null, check the next item in argv (the `--name Sam` case)
        if ( value === null ) {
          const nextValue = argv[ index + 1 ] && !argv[ index + 1 ].startsWith( '--' ) ? argv[ index + 1 ] : true;
          args[ key ] = nextValue;
        }
        else {
          args[ key ] = value; // For '--key=value' format
        }
      }
    } );
    return args;
  }

// Parse argv
  const parsedArgs = parseArgs( process.argv.slice( 2 ) );

  return parsedArgs;
};