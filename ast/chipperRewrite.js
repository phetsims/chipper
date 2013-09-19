/*
 * Abstract Syntax Tree modifier. This will read the input JS, turn it into an AST using esprima,
 * modify it (as noted below), and output JS with escodegen.
 *
 * NOTE: currently run twice, before and after. TODO: improve this!
 *
 * Modifications:
 *   - For variable declarations, any assignment that is of the form "var assert = require( 'ASSERT/assert')( ... );"
 *       will be removed.
 *   - Any standalone assignment to an 'assert' variable will be shortened to the right-hand value
 *   - Any "assert && assert( ... )" pattern will be replaced with null
 *   - Any reference (attempt to access a variable) to 'assert' will be replaced with null
 *   - define( "...", [...], function( require ) { ... } ) has the array replaced with [] (strips out dependency info unneeded by almond)
 */

// see https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API
(function( global ){
  var truthy = function( ob ) { return !!ob; };
  
  function isAssert( ast ) {
    return ast.type === 'Identifier' && ast.name === 'assert';
  }
  
  function rewriteProgram( ast ) {
    ast.body = ast.body.map( rewriteStatement ).filter( truthy );
  }
  
  function rewriteStatement( ast ) {
    ast.tagged = true;
    
    switch ( ast.type ) {
      case 'BlockStatement':
        ast.body = ast.body.map( rewriteStatement ).filter( truthy );
        break;
      case 'ExpressionStatement':
        ast.expression = rewriteExpression( ast.expression );
        break;
      case 'IfStatement':
        ast.test = rewriteExpression( ast.test );
        ast.consequent = rewriteStatement( ast.consequent );
        if ( ast.alternate ) {
          ast.alternate = rewriteStatement( ast.alternate );
        }
        break;
      case 'LabeledStatement':
        ast.body = rewriteStatement( ast.body );
        break;
      case 'SwitchStatement':
        ast.discriminant = rewriteExpression( ast.discriminant );
        ast.cases = ast.cases.map( function( switchCase ) {
          if ( switchCase.test ) {
            switchCase.test = rewriteExpression( switchCase.test );
          }
          switchCase.consequent = switchCase.consequent.map( rewriteStatement );
          return switchCase;
        } );
        break;
      case 'ReturnStatement':
        if ( ast.argument ) {
          ast.argument = rewriteExpression( ast.argument );
        }
        break;
      case 'ThrowStatement':
        if ( ast.argument ) {
          ast.argument = rewriteExpression( ast.argument );
        }
        break;
      case 'TryStatement':
        ast.block = rewriteStatement( ast.block );
        if ( ast.handler ) {
          ast.handler = rewriteCatch( ast.handler );
        }
        // API change maybe?
        if ( ast.handlers ) {
          ast.handlers = ast.handlers.map( rewriteCatch );
        }
        ast.guardedHandlers = ast.guardedHandlers.map( rewriteCatch );
        if ( ast.finalizer ) {
          ast.finalizer = rewriteStatement( ast.finalizer );
        }
        break;
      case 'WhileStatement':
        ast.test = rewriteExpression( ast.test );
        ast.body = rewriteStatement( ast.body );
        break;
      case 'DoWhileStatement':
        ast.test = rewriteExpression( ast.test );
        ast.body = rewriteStatement( ast.body );
        break;
      case 'ForStatement':
        if ( ast.init ) {
          ast.init = rewriteDeclOrExpr( ast.init );
        }
        if ( ast.test ) {
          ast.test = rewriteExpression( ast.test );
        }
        if ( ast.update ) {
          ast.update = rewriteExpression( ast.update );
        }
        ast.body = rewriteStatement( ast.body );
        break;
      case 'ForInStatement':
        ast.left = rewriteDeclOrExpr( ast.left );
        ast.right = rewriteExpression( ast.right );
        ast.body = rewriteStatement( ast.body );
        break;
      case 'ForOfStatement':
        ast.left = rewriteDeclOrExpr( ast.left );
        ast.right = rewriteExpression( ast.right );
        ast.body = rewriteStatement( ast.body );
        break;
      case 'LetStatement':
        /*
        interface LetStatement <: Statement {
    type: "LetStatement";
    head: [ { id: Pattern, init: Expression | null } ];
    body: Statement;
}       */
        throw new Error( 'TODO' );
      case 'Function':
      case 'FunctionDeclaration':
        ast.params = ast.params.map( rewritePattern );
        ast.defaults = ast.defaults.map( rewriteExpression );
        ast.body = rewriteStatement( ast.body );
        break;
      case 'VariableDeclaration':
        ast.declarations = ast.declarations.map( function( declarator ) {
          if ( isAssert( declarator.id ) &&
               declarator.init.type === 'CallExpression' &&
               declarator.init.callee.type === 'CallExpression' &&
               declarator.init.callee.callee.name === 'require' &&
               declarator.init.callee.arguments[0].value === 'ASSERT/assert' ) {
            return null;
          }
          declarator.id = rewritePattern( declarator.id );
          if ( declarator.init ) {
            declarator.init = rewriteExpression( declarator.init );
          }
          return declarator;
        } ).filter( truthy );
        if ( ast.declarations.length === 0 ) {
          return null;
        }
        break;
      case 'DebuggerStatement':
        break;
      case 'BreakStatement':
        break;
      case 'ContinueStatement':
        break;
      case 'WithStatement':
        throw new Error( 'Do not use with statements' );
      default:
        return rewriteExpression( ast );
    }
    return ast;
  }
  
  function rewritePattern( ast ) {
    return ast; // TODO: do we need this right now?
  }
  
  function rewriteCatch( ast ) {
    ast.param = rewritePattern( ast.param );
    if ( ast.guard ) {
      ast.guard = rewriteExpression( ast.guard );
    }
    ast.body = rewriteStatement( ast.body );
    return ast;
  }
  
  function rewriteDeclOrExpr( ast ) {
    if ( ast.type === 'VariableDeclaration' ) {
      return rewriteStatement( ast ); // since all declarations can be in place of statements
    } else {
      return rewriteExpression( ast );
    }
  }
  
  function rewriteExpression( ast ) {
    if ( ast === null ) {
      return null;
    }
    if ( isAssert( ast ) ) {
      return { type: 'Literal', value: null };
    }
    
    ast.tagged = true;
    
    switch ( ast.type ) {
      case 'ThisExpression':
        break;
      case 'ArrayExpression':
        ast.elements = ast.elements.map( rewriteExpression );
        break;
      case 'ObjectExpression':
        ast.properties = ast.properties.map( function( prop ) {
          prop.value = rewriteExpression( prop.value );
          return prop;
        } );
        break;
      case 'FunctionExpression':
        ast.params = ast.params.map( rewritePattern );
        ast.defaults = ast.defaults.map( rewriteExpression );
        ast.body = rewriteStatement( ast.body );
        break;
      case 'ArrowExpression':
        ast.params = ast.params.map( rewritePattern );
        ast.defaults = ast.defaults.map( rewriteExpression );
        ast.body = rewriteStatement( ast.body );
        break;
      case 'SequenceExpression':
        ast.expressions = ast.expressions.map( rewriteExpression );
        break;
      case 'UnaryExpression':
        ast.argument = rewriteExpression( ast.argument );
        break;
      case 'BinaryExpression':
        ast.left = rewriteExpression( ast.left );
        ast.right = rewriteExpression( ast.right );
        break;
      case 'AssignmentExpression':
        if ( isAssert( ast.left ) ) {
          return rewriteExpression( ast.right );
        }
        ast.left = rewriteExpression( ast.left );
        ast.right = rewriteExpression( ast.right );
        break;
      case 'UpdateExpression':
        ast.argument = rewriteExpression( ast.argument );
        break;
      case 'LogicalExpression':
        if ( ast.operator === '&&' && isAssert( ast.left ) ) {
          return { type: 'Literal', value: null };
        }
        ast.left = rewriteExpression( ast.left );
        ast.right = rewriteExpression( ast.right );
        break;
      case 'ConditionalExpression':
        ast.test = rewriteExpression( ast.test );
        ast.alternate = rewriteExpression( ast.alternate );
        ast.consequent = rewriteExpression( ast.consequent );
        break;
      case 'NewExpression':
        ast.callee = rewriteExpression( ast.callee );
        ast.arguments = ast.arguments.map( rewriteExpression );
        break;
      case 'CallExpression':
        ast.callee = rewriteExpression( ast.callee );
        ast.arguments = ast.arguments.map( rewriteExpression );
        
        // detect define( "...", [...], function( require ) { ... } );
        if ( ast.callee.type === 'Identifier' &&
             ast.callee.name === 'define' &&
             ast.arguments.length === 3 &&
             ast.arguments[0].type === 'Literal' &&
             ( typeof ast.arguments[0].value === 'string' ) &&
             ast.arguments[1].type === 'ArrayExpression' &&
             ast.arguments[2].type === 'FunctionExpression' &&
             ast.arguments[2].params.length === 1 &&
             ast.arguments[2].params[0].name === 'require' ) {
          
          // replace the arguments with the empty array, since this will be basically unneeded by almond.js
          ast.arguments[1].elements = [];
        }
        break;
      case 'MemberExpression':
        ast.object = rewriteExpression( ast.object );
        if ( ast.property.type !== 'Identifier' ) {
          ast.property = rewriteExpression( ast.property );
        }
        break;
      case 'YieldExpression':
        if ( ast.argument ) {
          ast.argument = rewriteExpression( ast.argument );
        }
        break;
      case 'ComprehensionExpression':
        throw new Error( 'TODO' );
      case 'LetExpression':
        throw new Error( 'TODO' );
    }
    return ast;
  }
  
  function rewriteFunction( ast ) {
    /*
    interface Function <: Node {
    id: Identifier | null;
    params: [ Pattern ];
    defaults: [ Expression ];
    rest: Identifier | null;
    body: BlockStatement | Expression;
    generator: boolean;
    expression: boolean;
}
    */
  }
  
  global.rewriteProgram = rewriteProgram;
  
  global.chipperRewrite = function chipperRewrite( contents, esprima, escodegen ) {
    var ast = esprima.parse( contents );
    
    rewriteProgram( ast );
    // var ast = esprima.parse( contents, { raw: true, tokens: true, range: true, comment: true } );
    // ast = escodegen.attachComments( ast, ast.comments, ast.tokens );
    var result = escodegen.generate( ast, {
      comment: true,
      format: {
        indent: {
          style: '  '
        },
        quotes: 'single'
      }
    } );
    return result;
  };
  
  if ( global.module ) {
    global.module.exports = chipperRewrite;
  }
})( this );

