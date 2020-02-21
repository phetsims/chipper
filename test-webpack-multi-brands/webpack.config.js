/* eslint-disable */
const path = require( 'path' );
const webpack = require( 'webpack' );

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
  config.plugins = [
    new webpack.IgnorePlugin( { resourceRegExp: /phetio\// } )
  ]
}

module.exports = config;