// Copyright 2025, University of Colorado Boulder

/**
 * fluent-print-patterns.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Emit up‑to‑10 sample renderings for every Fluent entry (message **or** term,
 * plus each attribute) in a given FTL file, along with a summary of the
 * parameters (variables / selectors) that influence it.
 *
 * usage:  sage run js/scripts/fluent-print-patterns.ts path/to/file.ftl
 *
 * Highlights
 * ──────────
 * • Correctly renders **terms** (identifiers that start with “‑”) by reading
 *   the compiled data held in  `bundle._terms`.
 * • Prints a `params:` line that lists every variable and its enumerated
 *   choices (or “(any)” if the variable has no fixed choice list).
 * • Guarantees at most 10 examples; constant strings produce exactly one.
 *
 * See https://github.com/phetsims/rosetta/issues/459
 *
 * @author Sam Reid (PhET Interactive Simulations)
 *
 * This software was developed with OpenAI o3.
 */

import * as fs from 'fs';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import { ASTEntry, FluentBundle, FluentResource, FluentParser, FluentSyntaxPattern, FluentSyntaxResource } from '../browser-and-node/FluentLibrary.js';

// ─── CLI handling ────────────────────────────────────────────────────────────
const filePath = process.argv[ 2 ];
if ( !filePath ) {
  console.error( 'usage: sage run js/scripts/fluent-print-patterns.ts <ftl-file>' );
  process.exit( 1 );
}
const source = fs.readFileSync( filePath, 'utf-8' );

// ─── Parse FTL & build entry index (for recursive walks) ─────────────────────
const parser = new FluentParser();
const resourceAst: FluentSyntaxResource = parser.parse( source );
const entryIndex = new Map<string, ASTEntry>(); // "id" | "-id" → Entry

for ( const entry of resourceAst.body ) {
  if ( 'id' in entry ) {
    // @ts-expect-error
    const id = entry.id.name;
    entryIndex.set(
      entry.type === 'Term' ? `-${id}` : id,
      entry
    );
  }
}

// ─── Recursive parameter extraction ──────────────────────────────────────────
type ChoicesMap = Map<string, Set<string>>;

function collectChoices(
  entry: ASTEntry,
  seen = new Set<ASTEntry>(),
  out?: ChoicesMap
): ChoicesMap {
  if ( seen.has( entry ) ) {
    return out ?? new Map();
  }
  seen.add( entry );
  const choices = out ?? new Map<string, Set<string>>();

  const walkPattern = ( pat?: FluentSyntaxPattern ) => {
    if ( !pat ) {
      return;
    }
    for ( const elem of pat.elements ) {
      if ( elem.type === 'Placeable' ) {
        visitExpression( elem.expression );
      }
    }
  };

  const visitExpression = ( expr: IntentionalAny ) => {
    switch( expr.type ) {
      case 'VariableReference': {
        const v = expr.id.name;
        if ( !choices.has( v ) ) {
          choices.set( v, new Set() );
        }
        break;
      }
      case 'SelectExpression': {
        if ( expr.selector.type === 'VariableReference' ) {
          const v = expr.selector.id.name;
          if ( !choices.has( v ) ) {
            choices.set( v, new Set() );
          }
          for ( const variant of expr.variants ) {
            const key =
              variant.key.type === 'NumberLiteral'
              ? variant.key.value
              : variant.key.name;
            choices.get( v )!.add( String( key ) );
            walkPattern( variant.value );
          }
        }
        visitExpression( expr.selector );
        break;
      }
      case 'MessageReference':
      case 'TermReference': {
        const refName =
          expr.id.type === 'Identifier' ? expr.id.name : String( expr.id.value );
        const refKey =
          expr.type === 'TermReference' ? `-${refName}` : refName;
        const refEntry = entryIndex.get( refKey );
        if ( refEntry ) {
          collectChoices( refEntry, seen, choices );
        }
        break;
      }
      case 'CallExpression': {
        for ( const pos of expr.positional ) {
          visitExpression( pos );
        }
        for ( const named of expr.named ) {
          visitExpression( named.value );
        }
        break;
      }
      case 'AttributeExpression':
      case 'VariantExpression':
        visitExpression( expr.id );
        break;
      default:
        break;
    }
  };

  if ( 'value' in entry && entry.value ) {

    // @ts-expect-error
    walkPattern( entry.value );
  }
  if ( 'attributes' in entry && entry.attributes ) {

    // @ts-expect-error
    for ( const attr of entry.attributes ) {
      walkPattern( attr.value );
    }
  }
  return choices;
}

// ─── Build runtime bundle ────────────────────────────────────────────────────
const bundle = new FluentBundle( 'en-US' );
bundle.addResource( new FluentResource( source ) );

// Helper: obtain the COMPILED pattern (array of elements) that the bundle
// uses internally.  Needed because we cannot pass raw AST `Pattern` objects
// into `formatPattern`.
function getCompiledPattern(
  id: string,
  attrName?: string
): IntentionalAny | undefined {
  if ( id.startsWith( '-' ) ) {
    // It's a term
    const termData: IntentionalAny = ( bundle as IntentionalAny )._terms.get( id.slice( 1 ) );
    if ( !termData ) {
      return undefined;
    }
    return attrName ? termData.attributes?.[ attrName ] : termData.value;
  }
  else {
    // It's a message
    const msg = bundle.getMessage( id );
    if ( !msg ) {
      return undefined;
    }
    return attrName ? msg.attributes?.[ attrName ] : msg.value;
  }
}

// ─── Helper: print parameter summary line ────────────────────────────────────
function printParams( paramArrays: Map<string, string[]> ): void {
  if ( paramArrays.size === 0 ) {
    console.log( '  params: (none)' );
    return;
  }
  const parts = [ ...paramArrays.entries() ]
    .sort( ( [ a ], [ b ] ) => a.localeCompare( b ) )
    .map(
      ( [ v, arr ] ) =>
        `${v} = ${arr.length ? arr.join( ' | ' ) : '(any)'}`
    );
  console.log( `  params: ${parts.join( ', ' )}` );
}

// ─── Main loop: iterate over every entry and emit output ─────────────────────
for ( const [ id, entry ] of entryIndex ) {
  // 1. Collect parameter choices (recursive)
  const choices = collectChoices( entry );
  const paramArrays = new Map<string, string[]>();
  let longest = 1;
  for ( const [ v, set ] of choices ) {
    const arr = [ ...set ];
    paramArrays.set( v, arr );
    if ( arr.length > longest ) {
      longest = arr.length;
    }
  }
  const examples = Math.min( 10, longest );

  // 2. Helper to build FluentArgs for sample i
  const buildArgs = ( i: number ): IntentionalAny => {
    const args: Record<string, IntentionalAny> = {};
    for ( const [ v, arr ] of paramArrays ) {
      args[ v ] = arr.length ? arr[ i % arr.length ] : `${v}${i}`;
    }
    return args;
  };

  // 3. Render main value (message or term)
  const mainPattern = getCompiledPattern( id );
  if ( mainPattern ) {
    console.log( `${id}:` );
    printParams( paramArrays );
    for ( let i = 0; i < examples; i++ ) {
      const rendered = bundle.formatPattern( mainPattern, buildArgs( i ) );
      console.log( `  - ${rendered}` );
    }
    console.log( '' );
  }

  // 4. Render each attribute (id.attrName)
  if ( 'attributes' in entry && entry.attributes ) {

    // @ts-expect-error
    for ( const attr of entry.attributes ) {
      const attrKey = `${id}.${attr.id.name}`;
      const attrPattern = getCompiledPattern( id, attr.id.name );
      if ( !attrPattern ) {
        continue;
      }
      console.log( `${attrKey}:` );
      printParams( paramArrays );
      for ( let i = 0; i < examples; i++ ) {
        const rendered = bundle.formatPattern( attrPattern, buildArgs( i ) );
        console.log( `  - ${rendered}` );
      }
      console.log( '' );
    }
  }
}