// Copyright 2023, University of Colorado Boulder
module.exports = {
  create( context ) {
    const filename = context.getFilename();

    // Array of forbidden directories and files
    const forbiddenImports = [
      '../common/',
      '../mean-and-median/',
      '../median/',
      '../variability/',
      '../center-and-variability-main.js',
      '../center-and-variability-phet-io-overrides.js',
      '../center-and-variability-tests.js',
      '../centerAndVariability.js',
      '../CenterAndVariabilityStrings.js'
    ];

    if ( filename.includes( '/soccer-common/' ) ) {
      return {
        ImportDeclaration( node ) {
          const importPath = node.source.value;
          if ( forbiddenImports.some( forbiddenPath => importPath.includes( forbiddenPath ) ) ) {
            context.report( {
              node: node,
              message: 'Files in \'soccer-common\' directory should not import from the forbidden directories or files.'
            } );
          }
        }
      };
    }
    return {};
  }
};