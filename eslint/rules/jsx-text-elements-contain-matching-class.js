// Copyright 2021, University of Colorado Boulder

/**
 * This rule verifies that a JSX node of type <p> contains a class in its className attribute called 'p'
 *
 * Future features include also assuring the same for h1, h2, a, li etc.
 * @author Matt Pennington
 */

const NO_CLASS_FOUND = 0;
const CLASS_FOUND = 1;
const CLASS_UNDETERMINABLE = 2;

module.exports = {
  create( context ) {

    return {

      // This listener will be called for all IfStatement nodes with blocks.
      'JSXOpeningElement[name.name=\'p\']': function( node ) {
        let status = NO_CLASS_FOUND;
        node.attributes.forEach( attribute => {
          if ( attribute.name.name === 'className' ) {
            // className is a stringLiteral, just split it on white space and look for 'p'
            if ( attribute.value.type === 'Literal' ) {
              const classes = attribute.value.value.split( ' ' );
              if ( classes.find( clazz => clazz === 'p' ) ) {
                status = CLASS_FOUND;
              }
            }
            else {
              status = CLASS_UNDETERMINABLE;
              if ( attribute.value.type === 'JSXExpressionContainer' && attribute.value.expression === 'TemplateLiteral' ) {
                attribute.value.expression.quasis.forEach( quasi => {
                  if ( quasi.value.raw.split( ' ' ).find( clazz => clazz === 'p' ) ) {
                    status = CLASS_FOUND;
                  }
                } );
              }
            }
          }
        } );
        if ( status === NO_CLASS_FOUND ) {
          context.report( {
            node: node,
            loc: node.loc,
            message: 'p elements require p class'
          } );
        }
        else if ( status === CLASS_UNDETERMINABLE ) {
          context.report( {
            node: node,
            message: 'p elements require p class'
          } );
        }
      }
    };
  }
};