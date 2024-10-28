// Copyright 2024, University of Colorado Boulder

/**
 * This script automates the process of tightening access modifiers within TypeScript files in a specified project.
 * It iterates over TypeScript files in the 'js/' directory, attempting to change public and protected class members
 * to private. It then runs the TypeScript type checker to validate these changes. If the type checker fails, it
 * escalates the access level from private to protected, and if necessary, back to public, testing the build at each
 * stage. This helps in enforcing stricter encapsulation in the codebase.
 *
 * Usage:
 * cd chipper/
 * sage run js/scripts/restrictAccessModifiers.ts [relative-path-to-repo-directory]
 *
 * Parameters:
 * [relative-path-to-repo-directory] - The path to the repository where TypeScript files are located. This script assumes
 *                            a 'tsconfig.json' file is present at the root of the specified directory.
 *
 * Options:
 * --help                   - Displays this help message and exits.
 *
 * Example:
 * sage run js/scripts/restrictAccessModifiers.ts ../my-ts-project
 *
 * Note:
 * - Ensure that 'tsconfig.json' is correctly set up in your project root.
 * - The script currently targets files within the 'js/' directory by default. Adjust the glob pattern in the
 *   getSourceFiles method call if your project structure differs.
 * - This script requires Node.js and the 'ts-morph' and 'child_process' packages.
 * - The script makes changes to the repo as it progresses. If you look at the source files while this script is running
 *   you will see the changes being made to trial values.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Matt Blackman (PhET Interactive Simulations)
 */

import { execSync } from 'child_process';
import { Project, Scope } from 'ts-morph';

// Function to tighten accessibility annotations
async function restrictAccessModifiers( repoPath: string ): Promise<void> {

  // Initialize a new ts-morph Project
  const project = new Project( {

    // Assuming tsconfig.json is in the root, adjust if necessary
    tsConfigFilePath: `${repoPath}/tsconfig.json`
  } );

  const sourceFiles = project.getSourceFiles( `${repoPath}/js/**/*.ts` ); // Adjust the glob pattern as necessary

  for ( const sourceFile of sourceFiles ) {
    const classes = sourceFile.getClasses();

    for ( const classDeclaration of classes ) {

      console.log( `# Processing class: ${classDeclaration.getName()}` );

      const members = [
        ...classDeclaration.getInstanceProperties(),
        ...classDeclaration.getInstanceMethods(),
        ...classDeclaration.getStaticProperties(),
        ...classDeclaration.getStaticMethods()
      ];

      for ( const member of members ) {

        console.log( member.getScope() + ' ' + member.getName() );

        if ( member.getScope() === 'public' || member.getScope() === 'protected' ) {

          // Try setting to private
          member.setScope( Scope.Private );
          await sourceFile.save();

          if ( !isBuildSuccessful() ) {

            // If not successful, try protected
            member.setScope( Scope.Protected );
            await sourceFile.save();

            if ( !isBuildSuccessful() ) {

              // If still not successful, revert to public
              member.setScope( Scope.Public );
              await sourceFile.save();
            }
            else {
              console.log( `    Successfully changed ${member.getName()} to protected.` );
            }
          }
          else {
            console.log( `    Successfully changed ${member.getName()} to private.` );
          }
        }
      }
    }
  }
}

// Check if there is a --help command line argument
if ( process.argv.includes( '--help' ) ) {
  console.log( `
\x1b[1mUsage:\x1b[0m
  \x1b[36mcd chipper/\x1b[0m
  \x1b[36msage run js/scripts/restrictAccessModifiers.ts [relative-path-to-repo-directory]\x1b[0m

\x1b[1mParameters:\x1b[0m
  \x1b[33m[relative-path-to-repo-directory]\x1b[0m - The path to the repository where TypeScript files are located. Assumes
                           a 'tsconfig.json' file is present at the root of the specified directory.

\x1b[1mOptions:\x1b[0m
  \x1b[32m--help\x1b[0m                  - Displays this help message and exits.

\x1b[1mExample:\x1b[0m
  \x1b[36msage run js/scripts/restrictAccessModifiers.ts ../my-ts-project\x1b[0m

\x1b[1mNote:\x1b[0m
- Ensure that 'tsconfig.json' is correctly set up in your project root.
- The script currently targets files within the 'js/' directory by default. Adjust the glob pattern in the
  getSourceFiles method call if your project structure differs.
- This script requires Node.js and the 'ts-morph' and 'child_process' packages.
- The script makes changes to the repo as it progresses. If you look at the source files while this script 
  is running you will see the changes being made to trial values.
  ` );
  process.exit( 0 );
}

// Check if the path to the repository directory is provided
if ( process.argv.length < 3 ) {
  console.error( 'Error: Please provide the path to the repository directory. Check --help for instructions.' );
  process.exit( 1 );
}

// Set the path to the repository directory
const repoPath = process.argv[ 2 ];

/**
 * Check if the proposed change (already saved to the filesystem) passes the type checker.
 */
function isBuildSuccessful(): boolean {
  try {

    // Specify the path to the TypeScript compiler you want to use
    const gruntCommand = require( '../../../perennial-alias/js/common/gruntCommand.js' );

    // Run the specified TypeScript compiler in the current directory
    execSync( `${gruntCommand} check`, {

      // set the working directory
      cwd: repoPath
    } );

    // If tsc exits without error, the build is successful
    return true;
  }
  catch( error ) {

    // If tsc exits with an error (non-zero exit code), the build failed
    return false;
  }
}

// Run the script
restrictAccessModifiers( repoPath ).then( () => console.log( 'Finished processing files.' ) );