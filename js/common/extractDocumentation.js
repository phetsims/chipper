// Copyright 2015-2020, University of Colorado Boulder

/**
 * Given the AST output from Esprima for a JS file that conforms to PhET's style, this extracts the documentation and
 * returns a structured object containing all of the documentation.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

/* eslint-env browser, node */
'use strict';

( function() {

  /**
   * Given esprima's block comment string value, strip off the leading spaces, a star, and up to one other space.
   * @private
   *
   * Thus given input:
   * var string = '*\n' + // leading star from the JSDoc style
   *              '   * Some code:\n' +
   *              '   * function something() {\n' +
   *              '   *   console.log( boo );\n' +
   *              '   * }\n' +
   *              '   ';
   *
   * will have the output:
   * var output = '\n' +
   *              'Some code:\n' +
   *              'function something() {\n' +
   *              '  console.log( boo );\n' + // keeps remaining spaces for indentation
   *              '}\n' +
   *              '' +
   *
   * @param {string} string
   * @returns {string}
   */
  function destarBlockComment( string ) {
    return string.split( '\n' ).map( line => {
      let destarred = line.replace( /^ *\* ?/, '' );

      // If the line is effectively empty (composed of only spaces), set it to the empty string.
      if ( destarred.replace( / /g, '' ).length === 0 ) {
        destarred = '';
      }
      return destarred;
    } ).join( '\n' );
  }

  /**
   * Removes leading/trailing blank lines, and consolidates consecutive blank lines into one blank line.
   * @private
   *
   * Thus for input: '\nFoo\n\nBar\n', the output would be 'Foo\nBar'
   *
   * @param {string} string
   * @returns {string}
   */
  function trimLines( string ) {
    const lines = string.split( '\n' );

    // remove consecutive blank lines
    for ( let i = lines.length - 1; i >= 1; i-- ) {
      if ( lines[ i ].length === 0 && lines[ i - 1 ].length === 0 ) {
        lines.splice( i, 1 );
      }
    }

    // remove leading blank lines
    while ( lines.length && lines[ 0 ].length === 0 ) {
      lines.shift();
    }

    // remove trailing blank lines
    while ( lines.length && lines[ lines.length - 1 ].length === 0 ) {
      lines.pop();
    }
    return lines.join( '\n' );
  }

  /**
   * Given a type string, e.g. '{number}', this should convert it into the desired type format.
   * @private
   *
   * @param {string} typeString
   * @returns {?}
   */
  function parseType( typeString ) {
    // For now, get rid of the brackets
    typeString = typeString.slice( 1, typeString.length - 1 );

    // for ( var i = 0; i < line.length; i++ ) {
    // TODO: handle |, {}, etc. https://github.com/phetsims/chipper/issues/411
    // }

    return typeString;
  }

  /**
   * Parses type-documentation lines that would be used with jsdoc params, etc., such as:
   * @private
   *
   * '{number} ratio - The ratio for something' parses to (with hasName = true):
   * {
   *   type: 'number', // result of parseType on '{number}'
   *   name: 'ratio',
   *   description: 'The ratio for something'
   * }
   *
   * '{number} The ratio for something' parses to (with hasName = false):
   * {
   *   type: 'number',
   *   description: 'The ratio for something'
   * }
   *
   * @param {string} line
   * @param {boolean} hasName
   * @returns {Object}
   */
  function splitTypeDocLine( line, hasName ) {
    let braceCount = 0;
    for ( let i = 0; i < line.length; i++ ) {
      if ( line[ i ] === '{' ) {
        braceCount++;
      }
      else if ( line[ i ] === '}' ) {
        braceCount--;

        // If we have matched the first brace, parse the type, check for a name, and return the rest as a description.
        if ( braceCount === 0 ) {
          const endOfType = i + 1;
          const type = line.slice( 0, endOfType );
          const rest = line.slice( endOfType + 1 );
          let name;
          let description;
          if ( hasName ) {
            const spaceIndex = rest.indexOf( ' ' );
            if ( spaceIndex < 0 ) {
              // all name
              name = rest;
            }
            else {
              // has a space
              name = rest.slice( 0, spaceIndex );
              description = rest.slice( spaceIndex + 1 );
            }
          }
          else {
            description = line.slice( endOfType + 1 );
          }
          const result = {
            type: parseType( type )
          };
          if ( name ) {
            if ( name.charAt( 0 ) === '[' ) {
              result.optional = true;
              name = name.slice( 1, name.length - 1 );
            }
            result.name = name;
          }
          if ( description ) {
            result.description = description.replace( /^ *(- )?/, '' );
          }
          return result;
        }
      }
    }
    return {
      type: parseType( line )
    };
  }

  /**
   * Parses a de-starred block comment (destarBlockComment output), extracting JSDoc-style tags. The rest is called the
   * description, which has blank linkes trimmed.
   * @private
   *
   * If a line has a JSDoc-style tag, consecutive lines afterwards that are indented will be included for that tag.
   *
   * Returns object like:
   * {
   *   description: {string}, // everything that isn't JSDoc-style tags
   *   [visibility]: {string}, // if it exists, one of 'public', 'private' or 'internal'
   *   [parameters]: {Array.<{ type: {?}, name: {string}, description: {string} }>}, // array of parsed parameters
   *   [returns]: { type: {?}, description: {string} }, // return tag
   *   [constant]: { type: {?}, name: {string}, description: {string} }, // constant tag
   *   [constructor]: true, // if the constructor tag is included
   *   [jsdoc]: {Array.<string>} // any unrecognized jsdoc tag lines
   * }
   *
   * @param {string} string
   * @returns {Object}
   */
  function parseBlockDoc( string ) {
    let result = {};

    const descriptionLines = [];
    const jsdocLines = [];

    const lines = string.split( '\n' );
    for ( let i = 0; i < lines.length; i++ ) {
      let line = lines[ i ];
      if ( line.charAt( 0 ) === '@' ) {
        for ( let j = i + 1; j < lines.length; j++ ) {
          const nextLine = lines[ j ];
          if ( nextLine.charAt( 0 ) === ' ' ) {
            // strip out all but one space, and concatenate
            line = line + nextLine.replace( /^ +/, ' ' );

            // we handled the line
            i++;
          }
          else {
            break;
          }
        }
        jsdocLines.push( line );
      }
      else {
        descriptionLines.push( line );
      }
    }

    result = {
      description: trimLines( descriptionLines.join( '\n' ) )
    };

    for ( let k = jsdocLines.length - 1; k >= 0; k-- ) {
      const jsdocLine = jsdocLines[ k ];
      if ( jsdocLine.indexOf( '@public' ) === 0 ) {
        if ( jsdocLine.indexOf( 'internal' ) === 0 ) {
          result.visibility = 'internal';
        }
        else {
          result.visibility = 'public';
        }
        jsdocLines.splice( k, 1 );
      }
      else if ( jsdocLine.indexOf( '@private' ) === 0 ) {
        result.visibility = 'private';
        jsdocLines.splice( k, 1 );
      }
      else if ( jsdocLine.indexOf( '@param ' ) === 0 ) {
        result.parameters = result.parameters || [];
        result.parameters.unshift( splitTypeDocLine( jsdocLine.slice( '@param '.length ), true ) );
        jsdocLines.splice( k, 1 );
      }
      else if ( jsdocLine.indexOf( '@returns ' ) === 0 ) {
        result.returns = splitTypeDocLine( jsdocLine.slice( '@returns '.length ), false );
        jsdocLines.splice( k, 1 );
      }
      else if ( jsdocLine.indexOf( '@constant ' ) === 0 ) {
        result.constant = splitTypeDocLine( jsdocLine.slice( '@constant '.length ), true );
        jsdocLines.splice( k, 1 );
      }
      else if ( jsdocLine.indexOf( '@constructor' ) === 0 ) {
        result.constructor = true;
        jsdocLines.splice( k, 1 );
      }
    }

    if ( jsdocLines.length ) {
      result.jsdoc = jsdocLines;
    }

    return result;
  }

  /**
   * Similar to parseBlockDoc, but for line comments. Returns null for comments without visibility.
   * @private
   *
   * A few line styles that are supported:
   *
   * %public {number} - Some comment
   * Will parse to: { visibility: 'public', type: 'number', description: 'Some comment' }
   *
   * %public (dot-internal) This has no type or dash
   * Will parse to: { visibility: 'internal', description: 'This has no type or dash' }
   *
   * @param {string} string
   * @returns {Object}
   */
  function parseLineDoc( string ) {
    let visibility;

    // Strip visibility tags, recording the visibility
    if ( string.indexOf( '@public' ) >= 0 ) {
      if ( string.indexOf( '-internal)' ) >= 0 ) {
        visibility = 'internal';
        string = string.replace( '/@public.*-internal)', '' );
      }
      else {
        visibility = 'public';
        string = string.replace( '@public', '' );
      }
    }
    if ( string.indexOf( '@private' ) >= 0 ) {
      visibility = 'private';
      string = string.replace( '@private', '' );
    }

    // Strip leading spaces
    string = string.replace( /^ +/, '' );

    // Ignore things without visibility
    if ( !visibility ) {
      return null;
    }

    // Assume leading '{' is for a type
    if ( /^ *{/.test( string ) ) {
      const result = splitTypeDocLine( string, false );
      result.visibility = visibility;
      return result;
    }

    return {
      visibility: visibility,
      description: string.replace( /^ */, '' ).replace( / *$/, '' )
    };
  }

  /**
   * Extracts a documentation object (parseLineDoc/parseBlockDoc) from an Esprima AST node. Typically looks at the last
   * leading block comment if available, then the last leading public line comment.
   * @private
   *
   * Returns null if there is no suitable documentation.
   *
   * @param {Object} node - From the Esprima AST
   * @returns {Object} See parseLineDoc/parseBlockDoc for type information.
   */
  function extractDocFromNode( node ) {
    function blockCommentFilter( comment ) {
      return comment.type === 'Block' && comment.value.charAt( 0 ) === '*';
    }

    function lineCommentFilter( comment ) {
      return comment.type === 'Line' && comment.value.indexOf( '@public' ) >= 0;
    }

    let lineComments = [];
    if ( node.leadingComments ) {
      const blockComments = node.leadingComments.filter( blockCommentFilter );
      if ( blockComments.length ) {
        return parseBlockDoc( destarBlockComment( blockComments[ blockComments.length - 1 ].value ) );
      }
      else {
        lineComments = lineComments.concat( node.leadingComments.filter( lineCommentFilter ) );
      }
    }
    // NOTE: trailing comments were also recognized as leading comments for consecutive this.<prop> definitions.
    // Stripped out for now.
    // if ( node.trailingComments ) {
    //   lineComments = lineComments.concat( node.trailingComments.filter( lineCommentFilter ) );
    // }
    if ( lineComments.length ) {
      const comment = lineComments[ lineComments.length - 1 ];
      return parseLineDoc( comment.value.replace( /^ /, '' ) ); // strip off a single leading space
    }

    return null;
  }

  function isCapitalized( string ) {
    return string.charAt( 0 ) === string.charAt( 0 ).toUpperCase();
  }

  function capitalize( string ) {
    return string.charAt( 0 ).toUpperCase() + string.slice( 1 );
  }

  /**
   * Whether an esprima-parsed AST represents an assigment to an identifier on 'this', e.g.:
   * this.something = ...;
   * @private
   *
   * @param {Object} expr
   * @returns {boolean}
   */
  function isSimpleThisAssignment( expr ) {
    return expr.type === 'AssignmentExpression' &&
           expr.left.type === 'MemberExpression' &&
           expr.left.object.type === 'ThisExpression' &&
           expr.left.property.type === 'Identifier';
  }

  // e.g. console.log( JSON.stringify( extractDocumentation( program ), null, 2 ) );
  function extractDocumentation( program ) {
    const doc = {};

    function parseTypeExpression( typeStatement, typeExpression, name, parentName ) {
      const typeDoc = {
        comment: extractDocFromNode( typeStatement ),
        instanceProperties: [],
        staticProperties: [],
        constructorProperties: [],
        supertype: null, // filled in by inherit
        type: 'type',
        name: name
      };

      if ( parentName ) {
        typeDoc.parentName = parentName;
      }

      const constructorStatements = typeExpression.body.body; // statements in the constructor function body
      constructorStatements.forEach( constructorStatement => {
        if ( constructorStatement.type === 'ExpressionStatement' ) {
          if ( isSimpleThisAssignment( constructorStatement.expression ) ) {
            const comment = extractDocFromNode( constructorStatement );
            if ( comment ) {
              comment.name = constructorStatement.expression.left.property.name;
              typeDoc.constructorProperties.push( comment );
            }
          }
        }
      } );

      return typeDoc;
    }

    function parseStaticProperty( property ) {
      const key = property.key.name;

      // TODO: support static constants? https://github.com/phetsims/chipper/issues/411
      if ( property.value.type === 'FunctionExpression' ) {
        const staticDoc = extractDocFromNode( property );

        if ( staticDoc ) {
          staticDoc.type = 'function';
          staticDoc.name = key;
          return staticDoc;
        }
      }
      return null;
    }

    function parseInherit( expression ) {
      const supertype = expression.arguments[ 0 ].name;
      const subtype = expression.arguments[ 1 ].name;

      // If we haven't caught the constructor/type declaration, skip the inherit parsing
      if ( !doc[ subtype ] ) {
        return;
      }

      // Assign the supertype on the subtype
      doc[ subtype ].supertype = supertype;

      // Instance (prototype) properties
      if ( expression.arguments.length >= 3 ) {
        const instanceProperties = expression.arguments[ 2 ].properties;

        // For-iteration, so we can skip some items by incrementing i.
        for ( let i = 0; i < instanceProperties.length; i++ ) {
          const property = instanceProperties[ i ];
          const key = property.key.name;
          if ( property.value.type === 'FunctionExpression' ) {
            if ( doc[ subtype ] ) {
              const instanceDoc = extractDocFromNode( property );

              if ( instanceDoc ) {
                // Check to see if we have an ES5 getter/setter defined below
                if ( i + 1 < instanceProperties.length ) {
                  const nextProperty = instanceProperties[ i + 1 ];
                  const nextExpression = nextProperty.value;
                  if ( nextExpression.type === 'FunctionExpression' ) {
                    const nextKey = nextProperty.key.name;
                    const capitalizedNextName = capitalize( nextKey );
                    if ( nextProperty.kind === 'get' &&
                         ( 'get' + capitalizedNextName === key ) ||
                         ( 'is' + capitalizedNextName === key ) ) {
                      // Skip processing the ES5 getter next
                      i++;
                      instanceDoc.name = nextKey;
                      instanceDoc.explicitGetName = key;
                    }
                    else if ( nextProperty.kind === 'set' &&
                              'set' + capitalizedNextName === key ) {
                      // Skip processing the ES5 setter next
                      i++;
                      instanceDoc.name = nextKey;
                      instanceDoc.explicitSetName = key;
                    }
                  }
                }
                instanceDoc.type = 'function';
                instanceDoc.name = instanceDoc.name || key;
                doc[ subtype ].instanceProperties.push( instanceDoc );
              }
            }
          }
        }
      }

      // Static (constructor) properties
      if ( expression.arguments.length >= 4 ) {
        const staticProperties = expression.arguments[ 3 ].properties;

        staticProperties.forEach( property => {
          const staticDoc = parseStaticProperty( property );
          if ( doc[ subtype ] && staticDoc ) {
            doc[ subtype ].staticProperties.push( staticDoc );
          }
        } );
      }

      return doc[ subtype ];
    }

    // Dig into require structure
    const mainStatements = program.body[ 0 ].expression.arguments[ 0 ].body.body;

    doc.topLevelComment = extractDocFromNode( program.body[ 0 ] );

    for ( let i = 0; i < mainStatements.length; i++ ) {
      const topLevelStatement = mainStatements[ i ];

      // Top-level capitalized function declaration? Parse it as a Type
      if ( topLevelStatement.type === 'FunctionDeclaration' &&
           isCapitalized( topLevelStatement.id.name ) ) {
        const typeName = topLevelStatement.id.name;
        doc[ typeName ] = parseTypeExpression( topLevelStatement, topLevelStatement, typeName, null );
      }
      else if ( topLevelStatement.type === 'ExpressionStatement' ) {
        const expression = topLevelStatement.expression;

        // Call to inherit()
        if ( expression.type === 'CallExpression' && expression.callee.name === 'inherit' ) {
          parseInherit( expression );
        }
        else if ( expression.type === 'AssignmentExpression' &&
                  expression.left.type === 'MemberExpression' ) {
          const comment = extractDocFromNode( topLevelStatement );
          if ( comment &&
               expression.left.object.type === 'Identifier' &&
               expression.left.property.type === 'Identifier' &&
               doc[ expression.left.object.name ] ) {
            const innerName = expression.left.property.name;
            let type;

            // Inner Type, e.g. BinPacker.Bin = function Bin( ... ) { ... };
            if ( expression.right.type === 'FunctionExpression' &&
                 isCapitalized( innerName ) ) {
              doc[ innerName ] = parseTypeExpression( topLevelStatement, expression.right, innerName, expression.left.object.name );
            }
            // Other, e.g. Vector2.ZERO = ...;
            else {
              if ( expression.right.type === 'FunctionExpression' ) {
                type = 'function';
              }
              else {
                type = 'constant';
              }
              comment.type = type;
              comment.name = expression.left.property.name;
              doc[ expression.left.object.name ].staticProperties.push( comment );
            }
          }
        }
      }
      // Variable object initialization: e.g. var Utils = { ... };
      else if ( topLevelStatement.type === 'VariableDeclaration' &&
                topLevelStatement.declarations[ 0 ].type === 'VariableDeclarator' &&
                topLevelStatement.declarations[ 0 ].init &&
                topLevelStatement.declarations[ 0 ].init.type === 'ObjectExpression' &&
                isCapitalized( topLevelStatement.declarations[ 0 ].id.name ) ) {
        const objectName = topLevelStatement.declarations[ 0 ].id.name;
        doc[ objectName ] = {
          comment: extractDocFromNode( topLevelStatement ), // maybe not needed?
          properties: [],
          type: 'object',
          name: objectName
        };

        // Process properties in the object
        topLevelStatement.declarations[ 0 ].init.properties.forEach( property => {
          const staticDoc = parseStaticProperty( property );
          if ( staticDoc ) {
            doc[ objectName ].properties.push( staticDoc );
          }
        } );
      }
    }
    return doc;
  }

  // Node.js-compatible definition
  if ( typeof module !== 'undefined' ) {
    module.exports = extractDocumentation;
  }

  // Browser direct definition (for testing)
  if ( typeof window !== 'undefined' ) {
    window.extractDocumentation = extractDocumentation;
  }
} )();
