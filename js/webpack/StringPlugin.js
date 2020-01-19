const fs = require( 'fs' );
const path = require( 'path' );

class StringPlugin {
  constructor( reposByNamespace ) {
    this.reposByNamespace = reposByNamespace;
  }

  apply( resolver ) {
    resolver.hooks.resolve.tapAsync( 'StringPlugin', ( request, resolveContext, callback ) => {
      if ( request.request.startsWith( 'string:' ) ) {
        const buildDir = path.resolve( __dirname, 'build' );
        const stringsDir = path.resolve( buildDir, 'strings' );
        if ( !fs.existsSync( buildDir ) ) {
          fs.mkdirSync( buildDir );
        }
        if ( !fs.existsSync( stringsDir ) ) {
          fs.mkdirSync( stringsDir );
        }

        const stringKey = request.request.slice( 'string:'.length );
        const namespace = stringKey.slice( 0, stringKey.indexOf( '/' ) );
        const key = stringKey.slice( namespace.length + 1 );
        const repo = this.reposByNamespace[ namespace ];
        const stringModuleFile = path.resolve( stringsDir, stringKey.replace( /[ \\\/\.-]/g, '_' ) + '.js' );

        // TODO: alternate locale lookup
        fs.writeFileSync( stringModuleFile, `
import strings from '${namespace}/../${repo}-strings_en.json';
export default _.get( strings, ${JSON.stringify( key )} ).value;
` );

        const newRequest = {
          ...request,
          request: request.request,
          path: stringModuleFile
        };
        return resolver.doResolve( resolver.ensureHook( 'file' ), newRequest, null, resolveContext, callback );
      }

      const result = resolver.doResolve( resolver.ensureHook( 'parsedResolve' ), request, null, resolveContext, callback );
      return result;
    } );
  }
}

module.exports = StringPlugin;
