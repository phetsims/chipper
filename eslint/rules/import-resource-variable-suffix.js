// Copyright 2020, University of Colorado Boulder
/**
 * @fileoverview Rule to enforce that variable names for imported images and sounds have the conventional suffix.
 * "Sound" for sound imports and "Image" for images.
 *
 * The PhET team decided this was not required for strings.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @copyright 2021 University of Colorado Boulder
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {

  const soundSourceFileSuffixes = [ 'mp3.js', 'wav.js' ];
  // const imageSourceFileSuffixes = [ 'png.js', 'jpg.js', 'cur.js' ];

  return {
    ImportDeclaration: node => {
      if ( node.source && node.source.value ) {

        // determine if the import source has an image or sound file suffix
        const containsSoundSuffix = soundSourceFileSuffixes.some( suffix => {
          return node.source.value.endsWith( suffix );
        } );

        // const containsImageSuffix = imageSourceFileSuffixes.some( suffix => {
        //   return node.source.value.endsWith( suffix );
        // } );

        // if ( containsSoundSuffix || containsImageSuffix ) {
        if ( containsSoundSuffix ) {
          // const requiredVariableSuffix = containsSoundSuffix ? 'Sound' : 'Image';
          const requiredVariableSuffix = 'Sound';

          // the Specifier (AST node containing the variable name) must include
          // the right suffix
          node.specifiers.forEach( specifier => {
            if ( !specifier.local.name.endsWith( requiredVariableSuffix ) ) {
              context.report( {
                node: node,

                // report the loc of the variable so it gets highlighed by the IDE
                loc: specifier.local.loc,
                message: `Import variable missing ${requiredVariableSuffix} suffix.`
              } );
            }
          } );
        }
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];