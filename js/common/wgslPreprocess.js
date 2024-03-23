// Copyright 2023-2024, University of Colorado Boulder

/* eslint-env node */

/**
 * Preprocesses a WGSL string into a conditional form, with minification
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const _ = require( 'lodash' );
const path = require( 'path' );

const importString = '#import ';
const bindingsString = '#bindings';
const ifdefString = '#ifdef ';
const ifndefString = '#ifndef ';
const elseString = '#else';
const endifString = '#endif';
const optionString = '#option ';

const importStringToName = str => {
  const bits = str.split( '/' );
  return bits[ bits.length - 1 ];
};

const importStringToImportName = str => {
  const bits = str.split( '/' );
  return `i_${bits[ bits.length - 1 ]}`;
};

class Code {
  constructor( isRoot = false ) {
    this.beforeBindings = [];
    this.afterBindings = [];
    this.imports = [];

    if ( isRoot ) {
      this.isRoot = true;
      this.allImports = [];
      this.options = [];
    }
  }

  // @public
  hasConditionalsOrTemplates() {
    return this.beforeBindings.length > 1 || this.afterBindings.length > 1 ||
      ( this.beforeBindings.length === 1 && ( typeof this.beforeBindings[ 0 ] !== 'string' || this.beforeBindings[ 0 ].includes( '${' ) ) ) ||
      ( this.afterBindings.length === 1 && ( typeof this.afterBindings[ 0 ] !== 'string' || this.afterBindings[ 0 ].includes( '${' ) ) );
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
  toString( indent, pathToRoot, moduleName, repoName ) {
    let result = '';

    if ( this.isRoot ) {
      result += `// Copyright ${new Date().getFullYear()}, University of Colorado Boulder\n\n`;

      result += `import { u32, i32, f32, u32Hex, i32Hex, ConsoleLogger, ConsoleLoggedLine, ByteEncoder, U32Type, I32Type, Vec2uType, Vec3uType, Vec4uType, getArrayType, U32Order } from '${pathToRoot}alpenglow/js/imports.js'\n`;
      result += `import { ${repoName} } from '${pathToRoot}${repoName}/js/imports.js'\n`;
      const imports = _.uniq( this.allImports ).sort();
      imports.forEach( importString => {
        result += `import ${importStringToImportName( importString )} from '${importString}.js';\n`;
      } );

      result += '\n';
      result += `const ${moduleName} = ${this.hasConditionalsOrTemplates() ? 'options' : '()'} => `;
    }

    const run = ( item, before ) => {
      if ( typeof item === 'string' ) {
        result += `${indent}${before ? 'b' : 'a'} += \`${item}\`;\n`;
      }
      else {
        // a Conditional
        result += item.toString( indent, pathToRoot, moduleName, repoName );
      }
    };

    if ( this.isRoot ) {
      if ( !this.hasConditionalsOrTemplates() ) {
        result += '( {\n';
        result += `${indent}before: \`${this.beforeBindings.join( '\n' )}\`,\n`;
        result += `${indent}after: \`${this.afterBindings.join( '\n' )}\`,\n`;
        result += `${indent}imports: [ ${this.imports.map( importStringToImportName ).join( ', ' )} ]\n`;
        result += '} )';
      }
      else {
        result += '{\n';
        result += '  let result = {};\n'; // Might be replaced with a template function!!!
        result += '  const template = f => { result = f; return \'\'; };\n';

        _.uniq( this.allImports ).sort().forEach( importString => {
          result += `  const ${importStringToName( importString )} = ${importStringToImportName( importString )}( options );\n`;
        } );

        const options = _.uniq( this.options ).sort();
        options.forEach( option => {
          result += `  assert && assert( options.${option} !== undefined );\n`;
          result += `  const ${option} = options.${option};\n`;
        } );

        result += '  let b = \'\';\n';
        result += '  let a = \'\';\n';
        result += `  const i = [ ${this.imports.map( importStringToImportName ).join( ', ' )} ];\n`;

        this.beforeBindings.forEach( item => run( item, true ) );
        this.afterBindings.forEach( item => run( item, false ) );

        result += '  result.before = b;\n';
        result += '  result.after = a;\n';
        result += '  result.imports = _.uniq( i ).sort();\n';
        result += '  return result;\n';
        result += '}';
      }
      result += ';\n';

      result += `export default ${moduleName};\n`;
      result += `${repoName}.register( '${moduleName}', ${moduleName} );\n`;
    }
    else {
      if ( this.imports.length ) {
        result += `${indent}i.push( ${this.imports.map( importStringToImportName ).join( ', ' )} );\n`;
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
  toString( indent, pathToRoot, moduleName, repoName ) {
    let result = '';

    if ( this.included.isEmpty() && this.excluded.isEmpty() ) {
      return result;
    }

    if ( this.included.isEmpty() ) {
      result += `${indent}if ( !options[ ${JSON.stringify( this.name )} ] ) {\n`;
      result += this.excluded.toString( indent + '  ', pathToRoot, moduleName, repoName );
      result += `${indent}}\n`;
    }
    else {
      result += `${indent}if ( options[ ${JSON.stringify( this.name )} ] ) {\n`;
      result += this.included.toString( indent + '  ', pathToRoot, moduleName, repoName );
      result += `${indent}}\n`;
      if ( !this.excluded.isEmpty() ) {
        result += `${indent}else {\n`;
        result += this.excluded.toString( indent + '  ', pathToRoot, moduleName, repoName );
        result += `${indent}}\n`;
      }
    }

    return result;
  }
}

const wgslPreprocess = ( str, minify, pathToRoot, targetPath ) => {

  // sanity check
  str = str.replace( /\r\n/g, '\n' );

  const repoName = path.basename( path.resolve( targetPath, pathToRoot ) );
  const moduleName = `wgsl_${path.basename( targetPath ).split( '.' )[ 0 ]}`;

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
    else if ( line.startsWith( optionString ) ) {
      const optionName = line.substring( optionString.length );
      rootCode.options.push( optionName );
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

  return rootCode.toString( '  ', pathToRoot, moduleName, repoName );
};

module.exports = wgslPreprocess;