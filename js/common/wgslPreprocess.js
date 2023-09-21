// Copyright 2023, University of Colorado Boulder

/* eslint-env node */

/**
 * Preprocesses a WGSL string into a conditional form, with minification
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const _ = require( 'lodash' );

const importString = '#import ';
const bindingsString = '#bindings';
const ifdefString = '#ifdef ';
const ifndefString = '#ifndef ';
const elseString = '#else';
const endifString = '#endif';

const importStringToName = str => {
  const bits = str.split( '/' );
  return bits[ bits.length - 1 ];
};

class Code {
  constructor( isRoot = false ) {
    this.beforeBindings = [];
    this.afterBindings = [];
    this.imports = [];

    if ( isRoot ) {
      this.isRoot = true;
      this.allImports = [];
    }
  }

  // @public
  hasConditionals() {
    return this.beforeBindings.length > 1 || this.afterBindings.length > 1 ||
      ( this.beforeBindings.length === 1 && typeof this.beforeBindings[ 0 ] !== 'string' ) ||
      ( this.afterBindings.length === 1 && typeof this.afterBindings[ 0 ] !== 'string' );
  }

  // @public
  isEmpty() {
    return this.beforeBindings.length === 0 && this.afterBindings.length === 0 && this.imports.length === 0;
  }

  // @public
  finalize( minify ) {
    for ( let i = 0; i < this.beforeBindings.length; i++ ) {
      const item = this.beforeBindings[ i ];
      if ( typeof item === 'string' ) {
        this.beforeBindings[ i ] = minify( item );
      }
    }
    for ( let i = 0; i < this.afterBindings.length; i++ ) {
      const item = this.afterBindings[ i ];
      if ( typeof item === 'string' ) {
        this.afterBindings[ i ] = minify( item );
      }
    }
  }

  // @public
  toString( indent = '  ' ) {
    let result = '';

    if ( this.isRoot ) {
      result += `// Copyright ${new Date().getFullYear()}, University of Colorado Boulder\n\n`;

      const imports = _.uniq( this.allImports ).sort();
      imports.forEach( importString => {
        result += `import ${importStringToName( importString )} from '${importString}.js';\n`;
      } );

      result += '\n';
      result += `export default = ${this.hasConditionals() ? 'includesMap' : '()'} => `;
    }

    const run = ( item, before ) => {
      if ( typeof item === 'string' ) {
        result += `${indent}${before ? 'b' : 'a'} += ${JSON.stringify( item )};\n`;
      }
      else {
        // a Conditional
        result += item.toString( indent );
      }
    };

    if ( this.isRoot ) {
      if ( !this.hasConditionals() ) {
        result += '( {\n';
        result += `${indent}before: ${JSON.stringify( this.beforeBindings.join( '\n' ) )},\n`;
        result += `${indent}after: ${JSON.stringify( this.afterBindings.join( '\n' ) )},\n`;
        result += `${indent}imports: [ ${this.imports.map( importStringToName ).join( ', ' )} ]\n`;
        result += '} )';
      }
      else {
        result += '{\n';
        result += '  const b = \'\';\n';
        result += '  const a = \'\';\n';
        result += `  const i = [ ${this.imports.map( importStringToName ).join( ', ' )} ];\n`;

        this.beforeBindings.forEach( item => run( item, true ) );
        this.afterBindings.forEach( item => run( item, false ) );

        result += '  return { before: b, after: a, imports: _.uniq( i ).sort() };\n';
        result += '}';
      }
      result += ';\n';
    }
    else {
      if ( this.imports.length ) {
        result += `${indent}i.push( ${this.imports.map( importStringToName ).join( ', ' )} );\n`;
      }
      this.beforeBindings.forEach( item => run( item, true ) );
      this.afterBindings.forEach( item => run( item, false ) );
    }

    return result;
  }
}

class Conditional {
  constructor( name ) {
    this.name = name.trim();
    this.included = new Code();
    this.excluded = new Code();

    if ( this.name.includes( ' ' ) ) {
      throw new Error( 'conditionals should not include spaces' );
    }
  }

  // @public
  toString( indent ) {
    let result = '';

    if ( this.included.isEmpty() && this.excluded.isEmpty() ) {
      return result;
    }

    if ( this.included.isEmpty() ) {
      result += `${indent}if ( !includesMap[ ${JSON.stringify( this.name )} ] ) {\n`;
      result += this.excluded.toString( indent + '  ' );
      result += `${indent}}\n`;
    }
    else {
      result += `${indent}if ( includesMap[ ${JSON.stringify( this.name )} ] ) {\n`;
      result += this.included.toString( indent + '  ' );
      result += `${indent}}\n`;
      if ( !this.excluded.isEmpty() ) {
        result += `${indent}else {\n`;
        result += this.excluded.toString( indent + '  ' );
        result += `${indent}}\n`;
      }
    }

    return result;
  }
}

const wgslPreprocess = ( str, minify ) => {

  // sanity check
  str = str.replace( /\r\n/g, '\n' );

  const lines = str.split( '\n' );

  const rootCode = new Code( true );
  const conditionalStack = [];
  const stack = [ rootCode ];

  let afterBindings = false;

  lines.forEach( line => {
    const topNode = stack[ stack.length - 1 ];
    const array = afterBindings ? topNode.afterBindings : topNode.beforeBindings;

    if ( line.startsWith( importString ) ) {
      const importName = line.substring( importString.length );
      topNode.imports.push( importName );
      rootCode.allImports.push( importName );
    }
    else if ( line.startsWith( bindingsString ) ) {
      afterBindings = true;
    }
    else if ( line.startsWith( ifdefString ) ) {
      const conditional = new Conditional( line.substring( ifdefString.length ) );
      array.push( conditional );
      conditionalStack.push( conditional );
      stack.push( conditional.included );
    }
    else if ( line.startsWith( ifndefString ) ) {
      const conditional = new Conditional( line.substring( ifndefString.length ) );
      array.push( conditional );
      conditionalStack.push( conditional );
      stack.push( conditional.excluded );
    }
    else if ( line.startsWith( elseString ) ) {
      if ( conditionalStack.length === 0 ) {
        throw new Error( 'unmatched else' );
      }
      const conditional = conditionalStack[ conditionalStack.length - 1 ];
      const oldCode = stack.pop();
      oldCode.finalize( minify );
      stack.push( oldCode === conditional.excluded ? conditional.included : conditional.excluded );
    }
    else if ( line.startsWith( endifString ) ) {
      if ( conditionalStack.length === 0 ) {
        throw new Error( 'unmatched endif' );
      }
      conditionalStack.pop();
      stack.pop().finalize( minify );
    }
    else {
      if ( array.length && typeof array[ array.length - 1 ] === 'string' ) {
        array[ array.length - 1 ] += '\n' + line;
      }
      else {
        array.push( line );
      }
    }
  } );

  rootCode.finalize( minify );

  if ( conditionalStack.length > 0 ) {
    throw new Error( 'unterminated conditional' );
  }

  return rootCode.toString();
};

module.exports = wgslPreprocess;
