// Copyright 2023, University of Colorado Boulder
/**
 * @name prefer-derived-string-property
 * @fileoverview Rule to check that you use DerivedStringProperty if providing a phetioValueType of StringIO to
 * DerivedProperty.
 *
 * MK used https://eslint.org/docs/latest/extend/custom-rules to assist in development of this rule.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @copyright 2016 University of Colorado Boulder
 */


//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
module.exports = {
  meta: {
    fixable: 'code' // or 'whitespace' depending on the nature of your fixes
  },
  create: function( context ) {
    return {
      NewExpression( node ) {

        // Check if the constructor is 'DerivedProperty'
        if ( node.callee.type === 'Identifier' && node.callee.name === 'DerivedProperty' ) {

          const options = node.arguments[ 2 ];

          // Check if there is an options argument
          if ( options && options.type === 'ObjectExpression' ) {

            const phetioValueTypeProperty = options.properties.find( prop => {
              return prop.key.type === 'Identifier' && prop.key.name === 'phetioValueType';
            } );
            // Check if 'phetioValueType' property is 'StringIO'
            if ( phetioValueTypeProperty && phetioValueTypeProperty.value.type === 'Identifier' &&
                 phetioValueTypeProperty.value.name === 'StringIO' ) {
              context.report( {
                node: node,
                message: 'Avoid using StringIO as phetioValueType',
                fix: fixer => {

                  // Replace DerivedProperty with DerivedStringProperty
                  const derivedStringPropertyReplacement = fixer.replaceTextRange( node.callee.range, 'DerivedStringProperty' );

                  // Remove `phetioValueType: StringIO`
                  const phetioValueTypePropertyRange = [ phetioValueTypeProperty.range[ 0 ] - 1, phetioValueTypeProperty.range[ 1 ] + 1 ];
                  const removeStringIoOption = fixer.removeRange( phetioValueTypePropertyRange );

                  return [ derivedStringPropertyReplacement, removeStringIoOption ];
                }
              } );
            }
          }
        }
      }
    };
  }
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];