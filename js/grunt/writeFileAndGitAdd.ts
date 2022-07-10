// Copyright 2022, University of Colorado Boulder

/**
 * Writes a file with grunt and adds it to git.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

const gitIsClean = async ( repo: string, file: string ) => {
  const gitArgs = [ 'status', '--porcelain' ];

  if ( file ) {
    gitArgs.push( file );
  }

  const p = Deno.run( {
    cmd: [ 'git', ...gitArgs ],
    cwd: `../${repo}`,
    stdout: 'piped',
    stderr: 'piped',
    stdin: 'piped'
  } );
  await p.status();

  const stdout = new TextDecoder().decode( await p.output() );
  return stdout.length === 0;
};

const gitAdd = async ( repo: string, file: string ) => {
  const p = Deno.run( {
    cmd: `git add ${file}`.split( ' ' ),
    cwd: `../${repo}`,
    stdout: 'piped',
    stderr: 'piped',
    stdin: 'piped'
  } );
  await p.status();

  console.log( new TextDecoder().decode( await p.output() ) );
  console.log( new TextDecoder().decode( await p.stderrOutput() ) );
};

/**
 * @param repo - The repository name
 * @param filePath - File name and potentially path relative to the repo
 * @param content - The content of the file as a string
 */
export default async function( repo: string, filePath: string, content: string ): Promise<void> {
  const outputFile = `../${repo}/${filePath}`;
  Deno.writeTextFileSync( outputFile, content );

  const fileClean = await gitIsClean( repo, filePath );
  if ( !fileClean ) {
    await gitAdd( repo, filePath );
  }
}