// Copyright 2024, University of Colorado Boulder

/**
 * Description: Iterates through a list of repositories, checks for package.json and tsconfig.json,
 *              and updates tsconfig.json to include project references based on phet.phetLibs.
 *
 * TODO: https://github.com/phetsims/chipper/issues/1356 delete script
 *
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
      const tsconfigPath = path.join( repoPath, 'tsconfig.json' );

      const hasPackageJson = await fileExists( packageJsonPath );
      const hasTsconfig = await fileExists( tsconfigPath );

      if ( !hasPackageJson || !hasTsconfig ) {
        console.warn( `Skipping repository "${repoName}" as it ${!hasPackageJson ? 'lacks package.json' : ''}${!hasPackageJson && !hasTsconfig ? ' and ' : ''}${!hasTsconfig ? 'lacks tsconfig.json' : ''}.` );
        continue;
      }

      console.log( `Processing repository: ${repoName}` );

      // Read and parse package.json
      let packageJson;
      try {
        const packageData = await fs.readFile( packageJsonPath, 'utf-8' );
        packageJson = JSON.parse( packageData );
      }
      catch( err ) {
        console.error( `Error reading or parsing package.json in "${repoName}": ${err.message}` );
        continue;
      }

      // Extract phetLibs
      let phetLibs = [];
      if ( packageJson.phet && Array.isArray( packageJson.phet.phetLibs ) ) {
        phetLibs = packageJson.phet.phetLibs;
      }

      // Read and parse tsconfig.json
      let tsconfig;
      try {
        const tsconfigData = await fs.readFile( tsconfigPath, 'utf-8' );
        tsconfig = JSON.parse( tsconfigData );
      }
      catch( err ) {
        console.error( `Error reading or parsing tsconfig.json in "${repoName}": ${err.message}` );
        continue;
      }

      // Construct references array
      const references = [];

      if ( phetLibs.length > 0 ) {
        for ( const lib of phetLibs ) {
          references.push( { path: `../${lib}/tsconfig.json` } );
        }
      }

      // Always add buildjson reference
      references.push( { path: '../chipper/tsconfig/buildjson' } );

      // Add or update "references" field
      tsconfig.references = references;

      // Write the updated tsconfig.json back to the file
      try {
        const formattedTsconfig = JSON.stringify( tsconfig, null, 2 ) + '\n';
        await fs.writeFile( tsconfigPath, formattedTsconfig, 'utf-8' );
        console.log( `Updated tsconfig.json in "${repoName}".` );
      }
      catch( err ) {
        console.error( `Error writing tsconfig.json in "${repoName}": ${err.message}` );
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