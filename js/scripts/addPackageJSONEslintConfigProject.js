// Copyright 2024, University of Colorado Boulder

/**
 * Script: updateEslintConfig.js
 * Description: Iterates through a list of repositories, checks for package.json,
 *              and updates or creates eslintConfig to include parserOptions.project.
 *
 * TODO: https://github.com/phetsims/chipper/issues/1356 delete script
 * @author Sam Reid (PhET Interactive Simulations)
 */

// eslint-disable-next-line no-property-in-require-statement
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const os = require( 'os' );

/**
 * Utility function to check if a file exists.
 * @param {string} filepath - Path to the file.
 * @returns {Promise<boolean>} - True if exists, else false.
 */
async function fileExists( filepath ) {
  try {
    await fs.access( filepath );
    return true;
  }
  catch( err ) {
    return false;
  }
}

/**
 * Utility function to safely parse JSON.
 * @param {string} data - JSON string.
 * @param {string} repoName - Name of the repository (for logging).
 * @returns {Object|null} - Parsed JSON object or null if error.
 */
function safeJsonParse( data, repoName ) {
  try {
    return JSON.parse( data );
  }
  catch( err ) {
    console.error( `Error parsing JSON in "${repoName}": ${err.message}` );
    return null;
  }
}

/**
 * Main function to execute the script logic.
 */
async function main() {
  try {
    const homeDir = os.homedir();
    const rootDir = path.join( homeDir, 'phet', 'root' );
    const activeReposPath = path.join( rootDir, 'perennial', 'data', 'active-repos' );

    // Read the list of active repositories
    const reposData = await fs.readFile( activeReposPath, 'utf-8' );
    const repoNames = reposData.split( /\r?\n/ ).map( line => line.trim() ).filter( line => line.length > 0 );

    console.log( `Found ${repoNames.length} active repositories.` );

    for ( const repoName of repoNames ) {
      const repoPath = path.join( rootDir, repoName );
      const packageJsonPath = path.join( repoPath, 'package.json' );

      const hasPackageJson = await fileExists( packageJsonPath );

      if ( !hasPackageJson ) {
        console.warn( `Skipping repository "${repoName}" as it lacks package.json.` );
        continue;
      }

      console.log( `Processing repository: ${repoName}` );

      // Read and parse package.json
      let packageJson;
      try {
        const packageData = await fs.readFile( packageJsonPath, 'utf-8' );
        packageJson = safeJsonParse( packageData, repoName );
        if ( !packageJson ) {
          console.error( `Skipping repository "${repoName}" due to JSON parse error.` );
          continue;
        }
      }
      catch( err ) {
        console.error( `Error reading package.json in "${repoName}": ${err.message}` );
        continue;
      }

      // Initialize eslintConfig if it doesn't exist
      if ( !packageJson.eslintConfig ) {
        packageJson.eslintConfig = {
          extends: '../chipper/eslint/sim_eslintrc.js'
        };
        console.log( `Created eslintConfig for "${repoName}".` );
      }
      else {
        // Ensure "extends" includes the required path
        if ( !packageJson.eslintConfig.extends ) {
          packageJson.eslintConfig.extends = '../chipper/eslint/sim_eslintrc.js';
          console.log( `Added extends to eslintConfig for "${repoName}".` );
        }
        else if ( typeof packageJson.eslintConfig.extends === 'string' ) {
          if ( !packageJson.eslintConfig.extends.includes( '../chipper/eslint/sim_eslintrc.js' ) ) {
            // Convert to array if it's a string and doesn't include the required extend
            packageJson.eslintConfig.extends = [
              packageJson.eslintConfig.extends,
              '../chipper/eslint/sim_eslintrc.js'
            ];
            console.log( `Extended eslintConfig for "${repoName}".` );
          }
        }
        else if ( Array.isArray( packageJson.eslintConfig.extends ) ) {
          if ( !packageJson.eslintConfig.extends.includes( '../chipper/eslint/sim_eslintrc.js' ) ) {
            packageJson.eslintConfig.extends.push( '../chipper/eslint/sim_eslintrc.js' );
            console.log( `Appended extends to eslintConfig for "${repoName}".` );
          }
        }
        // If eslintConfig.extends is neither string nor array, log a warning
        else {
          console.warn( `Unexpected format for eslintConfig.extends in "${repoName}". Skipping extends modification.` );
        }
      }

      // Initialize overrides if it doesn't exist
      if ( !packageJson.eslintConfig.overrides ) {
        packageJson.eslintConfig.overrides = [];
        console.log( `Created overrides array in eslintConfig for "${repoName}".` );
      }

      // Find an existing override for "**/*.ts"
      let tsOverride = packageJson.eslintConfig.overrides.find( override => {
        return Array.isArray( override.files ) && override.files.includes( '**/*.ts' );
      } );

      if ( !tsOverride ) {
        // Create a new override for "**/*.ts"
        tsOverride = {
          files: [ '**/*.ts' ],
          parserOptions: {
            project: [ `../${repoName}/tsconfig.json` ]
          }
        };
        packageJson.eslintConfig.overrides.push( tsOverride );
        console.log( `Added new override for "**/*.ts" in "${repoName}".` );
      }
      else {
        // Ensure parserOptions.project exists and includes the required path
        if ( !tsOverride.parserOptions ) {
          tsOverride.parserOptions = {
            project: [ `../${repoName}/tsconfig.json` ]
          };
          console.log( `Added parserOptions to existing override in "${repoName}".` );
        }
        else {
          if ( !tsOverride.parserOptions.project ) {
            tsOverride.parserOptions.project = [ `../${repoName}/tsconfig.json` ];
            console.log( `Added project to parserOptions in "${repoName}".` );
          }
          else {
            // Ensure the project path is included
            const projectPath = `../${repoName}/tsconfig.json`;
            if ( !Array.isArray( tsOverride.parserOptions.project ) ) {
              tsOverride.parserOptions.project = [ tsOverride.parserOptions.project ];
            }
            if ( !tsOverride.parserOptions.project.includes( projectPath ) ) {
              tsOverride.parserOptions.project.push( projectPath );
              console.log( `Appended project path to parserOptions in "${repoName}".` );
            }
            else {
              console.log( `parserOptions.project already includes the path in "${repoName}".` );
            }
          }
        }
      }

      // Write the updated package.json back to the file
      try {
        const formattedPackageJson = JSON.stringify( packageJson, null, 2 ) + '\n';
        await fs.writeFile( packageJsonPath, formattedPackageJson, 'utf-8' );
        console.log( `Updated package.json in "${repoName}".\n` );
      }
      catch( err ) {
        console.error( `Error writing package.json in "${repoName}": ${err.message}` );
        continue;
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