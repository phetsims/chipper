// Copyright 2024, University of Colorado Boulder

/**
 * Script: updateEslintConfig.js
 * Description: Iterates through a list of repositories, checks for package.json,
 *              and updates or creates eslintConfig to include parserOptions.project.
 *
 * TODO: https://github.com/phetsims/chipper/issues/1356 delete script
 * @author Sam Reid (PhET Interactive Simulations)
 */

// eslint-disable-next-line phet/default-import-match-filename
import fs from 'fs/promises';
import _ from 'lodash';
// eslint-disable-next-line phet/bad-chipper-text
import loadJSON from '../perennial/js/common/loadJSON.js';
// eslint-disable-next-line phet/bad-chipper-text
import getActiveRepos from '../perennial/js/common/getActiveRepos.js';

///////////////////////
const DELETE = false;
const repoNames = await getActiveRepos();
// const repoNames = [ 'acid-base-solutions' ];

////////////////////////

export function flattenPackageEslintConfig( repo, eslintConfig ) {
  const cloned = _.cloneDeep( eslintConfig );
  const flattened = [];
  let configFileContents = `// Copyright 2024, University of Colorado Boulder

/**
 * ESlint configuration for ${repo}.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
`;

  const extended = eslintConfig.extends;

  if ( extended ) {
    console.log( extended );
    const handleOneExtension = ( entry, index = '' ) => {

      entry = entry.split( 'sim_eslintrc.js' ).join( 'sim.eslint.config.mjs' );
      entry = entry.split( 'chipper_eslintrc.js' ).join( 'chipper.eslint.config.mjs' );
      entry = entry.split( 'node_eslintrc.js' ).join( 'node.eslint.config.mjs' );
      entry = entry.split( 'phet-library_eslintrc.js' ).join( 'phet-library.eslint.config.mjs' );
      entry = entry.split( '.eslintrc.js' ).join( 'root.eslint.config.mjs' );

      const varName = `parent${index}`;
      configFileContents += `\nimport ${varName} from '${entry}';`;
      flattened.push( `BEGIN...${varName}END` );
    };

    if ( typeof extended === 'string' ) {
      handleOneExtension( extended );
    }
    else if ( Array.isArray( extended ) ) {
      extended.forEach( ( e, i ) => handleOneExtension( e, i + 1 ) );
    }
    else {
      throw new Error( 'AHHHHH' );
    }
  }

  delete cloned.extends;
  delete cloned.overrides;

  if ( Object.keys( cloned ).length > 0 ) {
    flattened.push( cloned );
  }

  eslintConfig.overrides?.forEach( override => flattened.push( override ) );

  configFileContents += `

export default ${JSON.stringify( flattened, null, 2 )};`;

  configFileContents = configFileContents.replace( /"BEGIN/g, '' );
  configFileContents = configFileContents.replace( /END"/g, '' );
  configFileContents = configFileContents.replace( /"/g, '\'' );


  return configFileContents;
}

/**
 * Main function to execute the script logic.
 */
async function main() {
  try {

    const rootDir = '../';


    console.log( `Found ${repoNames.length} active repositories.` );

    for ( const repoName of repoNames ) {
      const packagePath = `${rootDir}/${repoName}/package.json`;
      const eslintConfigPath = `${rootDir}/${repoName}/eslint.config.mjs`;

      let packageJSON;

      try {
        packageJSON = await loadJSON( packagePath );
      }
      catch( e ) {
        console.warn( `Skipping repository "${repoName}" as it lacks package.json.` );
        continue;
      }

      console.log( `Processing repository: ${repoName}` );

      // Initialize eslintConfig if it doesn't exist
      if ( !packageJSON.eslintConfig ) {
        console.log( `no eslintConfig in package for ${repoName}` );
        continue;
      }
      else {
        const flatConfigContents = flattenPackageEslintConfig( repoName, packageJSON.eslintConfig );
        console.log( flatConfigContents );
        await fs.writeFile( eslintConfigPath, flatConfigContents );
        console.log( '' );
        if ( DELETE ) {
          delete packageJSON.eslintConfig;
          await fs.writeFile( packagePath, JSON.stringify( packageJSON, null, 2 ) );
        }
      }
    }
    console.log( 'All applicable repositories have been processed.' );
  }
  catch( err ) {
    console.error( `An unexpected error occurred: ${err.message}` );
    process.exit( 1 );
  }
}

// Execute the main function
main();