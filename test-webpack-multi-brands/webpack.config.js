/* eslint-disable */
const path = require( 'path' );

const buildingPhetio = true;

const config = {
  mode: 'development',
  entry: {
    main: './main.js'
  },
  output: {
    filename: 'main.js'
  }
};

// if not in phetio brand, add a loader the stub out phetio modules
if ( !buildingPhetio ) {
  config.module = {

    // configuration regarding modules
    rules: [
      // rules for modules (configure loaders, parser options, etc.)
      {
        test: /phetio/,
        use: path.resolve( __dirname, 'phetioStub-loader.js' )
      }
    ]
  };
}

module.exports = config;