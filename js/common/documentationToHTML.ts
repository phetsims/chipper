// Copyright 2015-2026, University of Colorado Boulder

// eslint-disable-next-line phet/bad-typescript-text
// @ts-nocheck

/**
 * Given structured documentation output from extractDocumentation (and associated other metadata), this outputs both
 * HTML meant for a collapsible documentation index and HTML content for all of the documentation.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

let typeURLs = {
  // is replaced by every documentationToHTML() call
};

// borrowed from phet-core.
function escapeHTML( str ): string {
  // see https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet
  // HTML Entity Encoding
  return str
    .replace( /&/g, '&amp;' )
    .replace( /</g, '&lt;' )
    .replace( />/g, '&gt;' )
    .replace( /"/g, '&quot;' )
    .replace( /'/g, '&#x27;' )
    .replace( /\//g, '&#x2F;' );
}

/**
 * Parses the HTML looking for examples (matching #begin and #end) that have embedded #on/#off to control where code
 * examples are displayed. Breaks up everything into a concise paragraph structure (blank lines trigger the end of a
 * paragraph).
 */
function descriptionHTML( string: string ): string {
  let result = '';
  const lines = string.split( '\n' );

  let inParagraph = false;

  function insideParagraph(): void {
    if ( !inParagraph ) {
      result += '<p>\n';
      inParagraph = true;
    }
  }

  function outsideParagraph(): void {
    if ( inParagraph ) {
      result += '</p>\n';
      inParagraph = false;
    }
  }

  for ( let i = 0; i < lines.length; i++ ) {
    const line = lines[ i ];

    if ( line.startsWith( '#begin' ) ) {
      const initialLine = lines[ i ];
      const runLines = [];
      const displayLines = [];
      let isDisplayed = false;
      for ( i++; i < lines.length; i++ ) {
        if ( lines[ i ].startsWith( '#end' ) ) {
          break;
        }
        else if ( lines[ i ].startsWith( '#on' ) ) {
          isDisplayed = true;
        }
        else if ( lines[ i ].startsWith( '#off' ) ) {
          isDisplayed = false;
        }
        else {
          runLines.push( lines[ i ] );
          if ( isDisplayed ) {
            displayLines.push( lines[ i ] );
          }
        }
      }

      const runString = runLines.join( '\n' );
      const displayString = displayLines.join( '\n' );

      const canvasExampleMatch = initialLine.match( /^#begin canvasExample ([^ ]+) ([^x]+)x([^x]+)$/ );
      if ( canvasExampleMatch ) {
        outsideParagraph();

        const name = canvasExampleMatch[ 1 ];
        const width = canvasExampleMatch[ 2 ];
        const height = canvasExampleMatch[ 3 ];

        const exampleName = `example-${name}`;

        result += `<canvas id="${exampleName}" class="exampleScene"></canvas>`;
        result += '<script>(function(){';
        result += `var canvas = document.getElementById( "${exampleName}" );`;
        result += `canvas.width = ${width};`;
        result += `canvas.height = ${height};`;
        result += 'var context = canvas.getContext( "2d" );';
        result += runString;
        result += '})();</' + 'script>'; // eslint-disable-line no-useless-concat
        result += '<pre class="brush: js">\n';
        result += displayString;
        result += '</pre>';
      }
    }
    else {
      if ( line.length === 0 ) {
        outsideParagraph();
      }
      else {
        insideParagraph();
        result += `${line}\n`;
      }
    }
  }
  outsideParagraph();

  return result;
}

function typeString( type ): string {
  const url = typeURLs[ type ];
  if ( url ) {
    return ` <a href="${url}" class="type">${escapeHTML( type )}</a>`;
  }
  else {
    return ` <span class="type">${escapeHTML( type )}</span>`;
  }
}

function inlineParameterList( object ): string {
  let result = '';
  if ( object.parameters ) {
    result += `( ${object.parameters.map( parameter => {
      let name = parameter.name;
      if ( parameter.optional ) {
        name = `<span class="optional">${name}</span>`;
      }
      return `<span class="args">${typeString( parameter.type )} ${name}</span>`;
    } ).join( ', ' )} )`;
  }
  else if ( object.type === 'function' ) {
    result += '()';
  }
  return result;
}

function parameterDetailsList( object ): string {
  let result = '';
  const parametersWithDescriptions = object.parameters ? object.parameters.filter( parameter => {
    return !!parameter.description;
  } ) : [];

  if ( parametersWithDescriptions.length ) {
    result += '<table class="params">\n';
    parametersWithDescriptions.forEach( parameter => {
      let name = parameter.name;
      const description = parameter.description || '';
      if ( parameter.optional ) {
        name = `<span class="optional">${name}</span>`;
      }
      result += `<tr class="param"><td>${typeString( parameter.type )}</td><td>${name}</td><td> - </td><td>${description}</td></tr>\n`;
    } );
    result += '</table>\n';
  }
  return result;
}

function returnOrConstant( object ): string {
  let result = '';
  if ( object.returns || object.constant ) {
    const type = ( object.returns || object.constant ).type;
    if ( object.returns ) {
      result += ' :';
    }
    result += `<span class="return">${typeString( type )}</span>`;
  }
  return result;
}

function nameLookup( array: string[], name: string ): string | null {
  for ( let i = 0; i < array.length; i++ ) {
    if ( array[ i ].name === name ) {
      return array[ i ];
    }
  }
  return null;
}

/**
 * For a given doc (extractDocumentation output) and a base name for the file (e.g. 'Vector2' for Vector2.js),
 * collect top-level documentation (and public documentation for every type referenced in typeNmaes) and return an
 * object: { indexHTML: {string}, contentHTML: {string} } which includes the HTML for the index (list of types and
 * methods/fields/etc.) and content (the documentation itself).
 *
 * @param doc
 * @param baseName
 * @param typeNames - Names of types from this file to include in the documentation.
 * @param localTypeIds - Keys should be type names included in the same documentation output, and the values
 *                                should be a prefix applied for hash URLs of the given type. This helps prefix
 *                                things, so Vector2.angle will have a URL #vector2-angle.
 * @param externalTypeURLs - Keys should be type names NOT included in the same documentation output, and
 *                                    values should be URLs for those types.
 * @returns - With indexHTML and contentHTML fields, both strings of HTML.
 */
function documentationToHTML( doc: object, baseName: string, typeNames: string[], localTypeIds: object, externalTypeURLs: object ): { indexHTML: string; contentHTML: string } {
  let indexHTML = '';
  let contentHTML = '';

  // Initialize typeURLs for the output
  typeURLs = {};
  Object.keys( externalTypeURLs ).forEach( typeId => {
    typeURLs[ typeId ] = externalTypeURLs[ typeId ];
  } );
  Object.keys( localTypeIds ).forEach( typeId => {
    typeURLs[ typeId ] = `#${localTypeIds[ typeId ]}`;
  } );

  const baseURL = typeURLs[ baseName ];

  indexHTML += `<a class="navlink" href="${baseURL}" data-toggle="collapse" data-target="#collapse-${baseName}" onclick="$( '.collapse.in' ).collapse( 'toggle' ); return true;">${baseName}</a><br>\n`;
  indexHTML += `<div id="collapse-${baseName}" class="collapse">\n`;

  contentHTML += `<h3 id="${baseURL.slice( 1 )}" class="section">${baseName}</h3>\n`;
  contentHTML += descriptionHTML( doc.topLevelComment.description );

  typeNames.forEach( typeName => {
    const baseObject = doc[ typeName ];
    const baseURLPrefix = `${localTypeIds[ typeName ]}-`;

    // constructor
    if ( baseObject.type === 'type' ) {
      // Add a target for #-links if we aren't the baseName.
      if ( typeName !== baseName ) {
        contentHTML += `<div id="${baseURLPrefix.slice( 0, baseURLPrefix.length - 1 )}"></div>`;
      }
      let constructorLine = typeName + inlineParameterList( baseObject.comment );
      if ( baseObject.supertype ) {
        constructorLine += ` <span class="inherit">extends ${typeString( baseObject.supertype )}</span>`;
      }
      contentHTML += `<h4 id="${baseURLPrefix}constructor" class="section">${constructorLine}</h4>`;
      contentHTML += descriptionHTML( baseObject.comment.description );
      contentHTML += parameterDetailsList( baseObject.comment );
    }

    const staticProperties = baseObject.staticProperties || baseObject.properties || [];
    const staticNames = staticProperties.map( prop => prop.name ).sort();
    staticNames.forEach( name => {
      const object = nameLookup( staticProperties, name );

      indexHTML += `<a class="sublink" href="#${baseURLPrefix}${object.name}">${object.name}</a><br>`;

      let typeLine = `<span class="entryName">${typeName}.${object.name}</span>`;
      typeLine += inlineParameterList( object );
      typeLine += returnOrConstant( object );
      contentHTML += `<h5 id="${baseURLPrefix}${object.name}" class="section">${typeLine}</h5>`;
      if ( object.description ) {
        contentHTML += descriptionHTML( object.description );
      }
      contentHTML += parameterDetailsList( object );

    } );

    if ( baseObject.type === 'type' ) {
      const constructorNames = baseObject.constructorProperties.map( prop => prop.name ).sort();
      constructorNames.forEach( name => {
        const object = nameLookup( baseObject.constructorProperties, name );

        indexHTML += `<a class="sublink" href="#${baseURLPrefix}${object.name}">${object.name}</a><br>`;

        let typeLine = `<span class="entryName">${object.name}</span>`;
        typeLine += ` <span class="property">${typeString( object.type )}</span>`;
        contentHTML += `<h5 id="${baseURLPrefix}${object.name}" class="section">${typeLine}</h5>`;
        if ( object.description ) {
          contentHTML += descriptionHTML( object.description );
        }
      } );
    }
    if ( baseObject.type === 'type' ) {
      const instanceNames = baseObject.instanceProperties.map( prop => prop.name ).sort();
      instanceNames.forEach( name => {
        const object = nameLookup( baseObject.instanceProperties, name );

        indexHTML += `<a class="sublink" href="#${baseURLPrefix}${object.name}">${object.name}</a><br>`;

        let typeLine = `<span class="entryName">${object.name}</span>`;
        if ( object.explicitGetName ) {
          typeLine += ` <span class="property">${typeString( object.returns.type )}</span>`;
          typeLine += ` <span class="entryName explicitSetterGetter">${object.explicitGetName}`;
        }
        if ( object.explicitSetName ) {
          typeLine += ` <span class="property">${typeString( object.returns.type )}</span>`;
          typeLine += ` <span class="entryName explicitSetterGetter">${object.explicitSetName}`;
        }
        typeLine += inlineParameterList( object );
        typeLine += returnOrConstant( object );
        if ( object.explicitSetName || object.explicitGetName ) {
          typeLine += '</span>';
        }
        contentHTML += `<h5 id="${baseURLPrefix}${object.name}" class="section">${typeLine}</h5>`;
        contentHTML += descriptionHTML( object.description );
        contentHTML += parameterDetailsList( object );
      } );
    }
  } );

  indexHTML += '</div>';

  return {
    indexHTML: indexHTML,
    contentHTML: contentHTML
  };
}

export default documentationToHTML;