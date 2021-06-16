[object Promise]

const _ = require( 'lodash' ); // eslint-disable-line
const fs = require( 'fs' );
const generatePhetioMacroAPI = require( './generatePhetioMacroAPI' );
const formatPhetioAPI = require( './formatPhetioAPI' );
const getSimList = require( '../common/getSimList' );

/**
 * Runs generate-phet-io-api for the specified simulations, or all phet-io sims if not specified. This may take a couple
 * of minutes to run fully, depending on how many sims are being run.
 *
 * USAGE:
 * cd chipper
 * node js/phet-io/output-apis.js [--simList=path] [--sims=sim1,sim2,...] [--temporary]
 *
 * e.g.,
 * node js/phet-io/output-apis.js --simList=../perennial/data/phet-io
 *
 * OPTIONS:
 * It will default to include all phet-io sims unless you specify a subset
 * --sims=sim1,sim2: a listed subset of sims
 * --simList=path/to/list
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
( async () => {

  const repos = getSimList();
  const args = process.argv.slice( 2 );

  const chunkSize = 4;
  const results = await generatePhetioMacroAPI( repos, {
    showProgressBar: true, // Interferes with file output
    chunkSize: chunkSize,
    showMessagesFromSim: false // must be pure JSON
  } );

  let dir = 'api';
  if ( args.includes( '--temporary' ) ) {
    dir = 'api-temporary';
    try {
      fs.mkdirSync( `../phet-io/${dir}/` );
    }
    catch( e ) {
      if ( !e.message.includes( 'file already exists' ) ) {
        throw e;
      }
    }
  }
  repos.forEach( repo => fs.writeFileSync( `../phet-io/${dir}/${repo}.json`, formatPhetioAPI( results[ repo ] ) ) );
} )();