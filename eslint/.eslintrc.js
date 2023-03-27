// Copyright 2015-2021, University of Colorado Boulder

/* eslint-disable todo-should-have-issue */
/**
 * The base eslint configuration for the PhET projects.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
module.exports = {

  // specify that this file is the root of the eslintrc tree, so eslint won't search past this file looking for a file
  // in a parent dir
  root: true,

  // Without a parser, .js files are linted without es6 transpilation. Use the same parser that we use for TypeScript.
  parser: '@typescript-eslint/parser',

  overrides: [
    {

      // For .ts files, the following configuration will be used
      files: [
        '**/*.ts',
        '**/*.tsx'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',

        // Provide a tsconfig so that we can use rules that require type information.
        // NOTE: Providing this slows down eslint substantially, see https://github.com/phetsims/chipper/issues/1114#issuecomment-1065927717
        project: [ '../chipper/tsconfig/all/tsconfig.json' ]
      },
      plugins: [
        '@typescript-eslint'
      ],
      rules: {

        // TypeScript ESLint Rules.  Legend
        // ✅ - recommended
        // 🔒 - strict
        // 🔧 - fixable
        // 🛠 - has-suggestions
        // 💭 - requires type information

        ////////////////////////////////////////////////////////////////////////
        // Supported Rules

        // Require that member overloads be consecutive ✅
        '@typescript-eslint/adjacent-overload-signatures': 'error',

        // Require using either T[] or Array<T> for arrays 🔒 🔧
        '@typescript-eslint/array-type': 'off', // We agreed this should be developer preference

        // Disallow awaiting a value that is not a Thenable ✅  💭
        '@typescript-eslint/await-thenable': 'error',

        // Disallow @ts-<directive> comments or require descriptions after directive ✅
        '@typescript-eslint/ban-ts-comment': [ 'error', {
          'ts-ignore': false, // Covered by '@typescript-eslint/prefer-ts-expect-error'
          'ts-check': true,
          'ts-expect-error': false, // TODO: Chip way as dev team
          'ts-nocheck': false // TODO: Chip way as dev team
        } ],

        // Disallow // tslint:<rule-flag> comments 🔒 🔧
        '@typescript-eslint/ban-tslint-comment': 'error',

        // Disallow certain types ✅ 🔧
        '@typescript-eslint/ban-types': [
          'error',
          {
            types: {
              Omit: {
                message: 'Prefer StrictOmit for type safety',
                fixWith: 'StrictOmit'
              }
            },
            extendDefaults: true
          }
        ],

        // Enforce that literals on classes are exposed in a consistent style 🔒 🔧
        '@typescript-eslint/class-literal-property-style': 'off', // This rule is not compatible with our mixin strategy, see https://github.com/phetsims/chipper/issues/1279

        // Enforce specifying generic type arguments on type annotation or constructor name of a constructor call 🔒 🔧
        '@typescript-eslint/consistent-generic-constructors': 'error', // It seems preferable to specify the type parameters at the `new` instantiation site

        // Require or disallow the Record type 🔒 🔧
        '@typescript-eslint/consistent-indexed-object-style': 'error',

        // Enforce consistent usage of type assertions 🔒
        '@typescript-eslint/consistent-type-assertions': 'error',

        // Enforce type definitions to consistently use either interface or type 🔒 🔧
        '@typescript-eslint/consistent-type-definitions': [ 'error', 'type' ], // We prefer using Type-Alias

        // Enforce consistent usage of type exports  🔧 💭
        '@typescript-eslint/consistent-type-exports': 'off', // We did not observe a performance boost, nor do we see a significant benefit from this rule. See https://github.com/phetsims/chipper/issues/1283

        // Enforce consistent usage of type imports  🔧
        '@typescript-eslint/consistent-type-imports': 'off', // We did not observe a performance boost, nor do we see a significant benefit from this rule. See https://github.com/phetsims/chipper/issues/1283

        // Require explicit return types on functions and class methods
        '@typescript-eslint/explicit-function-return-type': 'off', // We want to use inference on local arrow functions. We use explicit-method-return-type for the important cases.

        // Require explicit accessibility modifiers on class properties and methods  🔧
        '@typescript-eslint/explicit-member-accessibility': 'error',

        // Require explicit return and argument types on exported functions' and classes' public class methods
        '@typescript-eslint/explicit-module-boundary-types': 'error',

        // Require a specific member delimiter style for interfaces and type literals  🔧
        '@typescript-eslint/member-delimiter-style': 'error', // semi colons in type declarations.

        // Require a consistent member declaration order
        '@typescript-eslint/member-ordering': 'off', // We agreed to leave this rule off because it is more important to sort semantically than alphabetically

        // Enforce using a particular method signature syntax  🔧
        '@typescript-eslint/method-signature-style': 'off', // We agreed to leave this as developer preference.  Some developers prefer to use method style in interfaces and property style in types, but the rule doesn't support that option.

        // Enforce naming conventions for everything across a codebase   💭
        '@typescript-eslint/naming-convention': 'off', // TODO: We should decide on the conventions and enable this rule.

        // Require .toString() to only be called on objects which provide useful information when stringified 🔒  💭
        '@typescript-eslint/no-base-to-string': 'error',

        // Disallow non-null assertion in locations that may be confusing 🔒 🔧 🛠
        '@typescript-eslint/no-confusing-non-null-assertion': 'error',

        // Require expressions of type void to appear in statement position  🔧 🛠 💭
        '@typescript-eslint/no-confusing-void-expression': 'off', // It transforms `() => this.update()` to `() => { this.update(); }`, so is it really desirable?  Errors in 200 files

        // Disallow duplicate enum member values 🔒 🛠
        '@typescript-eslint/no-duplicate-enum-values': 'error',

        // Disallow using the delete operator on computed key expressions 🔒 🔧
        '@typescript-eslint/no-dynamic-delete': 'off', // TODO: Code should use Map or Set instead.  22 failures at the moment.  We would like to enable this rule.

        // Disallow the declaration of empty interfaces ✅ 🔧 🛠
        '@typescript-eslint/no-empty-interface': 'error',

        // Disallow the any type ✅ 🔧 🛠
        '@typescript-eslint/no-explicit-any': 'error',

        // Disallow extra non-null assertion ✅ 🔧
        '@typescript-eslint/no-extra-non-null-assertion': 'error',

        // Disallow classes used as namespaces 🔒
        '@typescript-eslint/no-extraneous-class': 'off', // It is sometimes useful to have a class with static methods that can call each other

        // Require Promise-like statements to be handled appropriately ✅ 🛠 💭
        '@typescript-eslint/no-floating-promises': 'error',

        // Disallow iterating over an array with a for-in loop ✅  💭
        '@typescript-eslint/no-for-in-array': 'error',

        // Disallow usage of the implicit any type in catch clauses  🔧 🛠
        '@typescript-eslint/no-implicit-any-catch': 'off', // Deprecated rule

        // Disallow explicit type declarations for variables or parameters initialized to a number, string, or boolean ✅ 🔧
        '@typescript-eslint/no-inferrable-types': 'error',

        // Disallow void type outside of generic or return types 🔒
        '@typescript-eslint/no-invalid-void-type': 'error',

        // Disallow the void operator except when used to discard a value 🔒 🔧 🛠 💭
        '@typescript-eslint/no-meaningless-void-operator': 'error',

        // Enforce valid definition of new and constructor ✅
        '@typescript-eslint/no-misused-new': 'error',

        // Disallow Promises in places not designed to handle them ✅  💭
        '@typescript-eslint/no-misused-promises': 'off', // TODO: Discuss this rule.  6 failures

        // Disallow custom TypeScript modules and namespaces ✅
        '@typescript-eslint/no-namespace': 'error',

        // Disallow non-null assertions in the left operand of a nullish coalescing operator 🔒 🛠
        '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',

        // Disallow non-null assertions after an optional chain expression ✅ 🛠
        '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',

        // Disallow non-null assertions using the ! postfix operator ✅ 🛠
        '@typescript-eslint/no-non-null-assertion': 'off', // We do not support this rule, see https://github.com/phetsims/chipper/issues/1114#issuecomment-1099536133

        // Disallow the use of parameter properties in class constructors
        '@typescript-eslint/no-parameter-properties': 'off', // This rule is deprecated.

        // Disallow members of unions and intersections that do nothing or override type information   💭
        '@typescript-eslint/no-redundant-type-constituents': 'off',

        // Disallow invocation of require()
        '@typescript-eslint/no-require-imports': 'error',

        // Disallow aliasing this ✅
        '@typescript-eslint/no-this-alias': 'error',

        // Disallow type aliases
        '@typescript-eslint/no-type-alias': 'off', // We use type-alias frequently and prefer them over interfaces

        // Disallow unnecessary equality comparisons against boolean literals 🔒 🔧 💭
        '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',

        // Disallow conditionals where the type is always truthy or always falsy 🔒 🔧 💭
        '@typescript-eslint/no-unnecessary-condition': 'off', // TODO: Would be nice to enable but 500 problems may prevent us

        // Disallow unnecessary namespace qualifiers  🔧 💭
        '@typescript-eslint/no-unnecessary-qualifier': 'off', // TODO: Enable this rule

        // Disallow type arguments that are equal to the default 🔒 🔧 💭
        '@typescript-eslint/no-unnecessary-type-arguments': 'error',

        // Disallow type assertions that do not change the type of an expression ✅ 🔧 💭
        '@typescript-eslint/no-unnecessary-type-assertion': 'error',

        // Disallow unnecessary constraints on generic types ✅ 🛠
        '@typescript-eslint/no-unnecessary-type-constraint': 'error',

        // Disallow calling a function with a value with type any ✅  💭
        '@typescript-eslint/no-unsafe-argument': 'off', // TODO: We should enable this rule, but it may be tricky since some of the any come from JS files. 412 failures

        // Disallow assigning a value with type any to variables and properties ✅  💭
        '@typescript-eslint/no-unsafe-assignment': 'off', // TODO: Enable this rule since it will help us avoid any.  547 problems, will need to chip-away

        // Disallow calling a value with type any ✅  💭
        '@typescript-eslint/no-unsafe-call': 'off', // TODO: Enable this rule since it will help us avoid any

        // Disallow member access on a value with type any ✅  💭
        '@typescript-eslint/no-unsafe-member-access': 'off', // TODO: Enable this rule since it will help us avoid any

        // Disallow returning a value with type any from a function ✅  💭
        '@typescript-eslint/no-unsafe-return': 'off', // TODO: Enable this rule since it will help us avoid any

        // Disallow empty exports that don't change anything in a module file  🔧 🛠
        '@typescript-eslint/no-useless-empty-export': 'error',

        // Disallow require statements except in import statements ✅
        '@typescript-eslint/no-var-requires': 'error',

        // Enforce non-null assertions over explicit type casts 🔒 🔧 💭
        '@typescript-eslint/non-nullable-type-assertion-style': 'error',

        // Require or disallow parameter properties in class constructors
        '@typescript-eslint/parameter-properties': 'off', // TODO: Let's discuss as a team. 16 failures.  Discuss parameter properties to discuss with the team.  Write up results in the typescript-conventions doc

        // Enforce the use of as const over literal type ✅ 🔧 🛠
        '@typescript-eslint/prefer-as-const': 'error',

        // Require each enum member value to be explicitly initialized  🛠
        '@typescript-eslint/prefer-enum-initializers': 'error',

        // Enforce the use of for-of loop over the standard for loop where possible 🔒
        '@typescript-eslint/prefer-for-of': 'off', // TODO: We agreed to enable this rule.  It will require chip-away since it has no autofix.  289 failures.

        // Enforce using function types instead of interfaces with call signatures 🔒 🔧
        '@typescript-eslint/prefer-function-type': 'off', // TODO: We agreed to enable this rule.  4 failures can be autofixed.

        // Enforce includes method over indexOf method 🔒 🔧 💭
        '@typescript-eslint/prefer-includes': 'error',

        // Require all enum members to be literal values 🔒
        '@typescript-eslint/prefer-literal-enum-member': 'error',

        // Require using namespace keyword over module keyword to declare custom TypeScript modules ✅ 🔧
        '@typescript-eslint/prefer-namespace-keyword': 'error',

        // Enforce using the nullish coalescing operator instead of logical chaining 🔒 🛠 💭
        '@typescript-eslint/prefer-nullish-coalescing': 'off', // TODO: Enable rule

        // Enforce using concise optional chain expressions instead of chained logical ands 🔒 🛠
        '@typescript-eslint/prefer-optional-chain': 'off', // TODO: We would like to discuss as a team.  It seems easier to read and write, so we would like to pursue it. 3227 failures.  Many cases may be assertions.  But some developers may want to use && in some cases.

        // Require private members to be marked as readonly if they're never modified outside of the constructor  🔧 💭
        '@typescript-eslint/prefer-readonly': 'off',

        // Require function parameters to be typed as readonly to prevent accidental mutation of inputs   💭
        '@typescript-eslint/prefer-readonly-parameter-types': 'off',

        // Enforce using type parameter when calling Array#reduce instead of casting 🔒 🔧 💭
        '@typescript-eslint/prefer-reduce-type-parameter': 'off', // TODO: Enable this rule

        // Enforce RegExp#exec over String#match if no global flag is provided  🔧 💭
        '@typescript-eslint/prefer-regexp-exec': 'off',

        // Enforce that this is used when only this type is returned 🔒 🔧 💭
        '@typescript-eslint/prefer-return-this-type': 'off',

        // Enforce using String#startsWith and String#endsWith over other equivalent methods of checking substrings 🔒 🔧 💭
        '@typescript-eslint/prefer-string-starts-ends-with': 'error',

        // Enforce using @ts-expect-error over @ts-ignore 🔒 🔧
        '@typescript-eslint/prefer-ts-expect-error': 'error',

        // Require any function or method that returns a Promise to be marked async  🔧 💭
        '@typescript-eslint/promise-function-async': 'off',

        // Require Array#sort calls to always provide a compareFunction   💭
        '@typescript-eslint/require-array-sort-compare': 'off',

        // Require both operands of addition to have type number or string ✅  💭
        '@typescript-eslint/restrict-plus-operands': 'off',

        // Enforce template literal expressions to be of string type ✅  💭
        '@typescript-eslint/restrict-template-expressions': 'off',

        // Enforce members of a type union/intersection to be sorted alphabetically  🔧 🛠
        '@typescript-eslint/sort-type-union-intersection-members': 'off', // We agreed to sort things semantically rather than alphabetically

        // Disallow certain types in boolean expressions  🔧 🛠 💭
        '@typescript-eslint/strict-boolean-expressions': 'off', // TODO: Is this a good rule for our team?

        // Require switch-case statements to be exhaustive with union type  🛠 💭
        '@typescript-eslint/switch-exhaustiveness-check': 'off', // TODO: Enable rule

        // Disallow certain triple slash directives in favor of ES6-style import declarations ✅
        '@typescript-eslint/triple-slash-reference': 'error',

        // Require consistent spacing around type annotations  🔧
        '@typescript-eslint/type-annotation-spacing': 'off', // TODO: Investigate.  7 failures

        // Require type annotations in certain places
        '@typescript-eslint/typedef': 'error',

        // Enforce unbound methods are called with their expected scope ✅  💭
        '@typescript-eslint/unbound-method': 'off',

        // Disallow two overloads that could be unified into one with a union or an optional/rest parameter 🔒
        '@typescript-eslint/unified-signatures': 'off', // TODO: Investigate. Probably enable. 6 failures

        ////////////////////////////////////////////////////////////////////////
        // Extension Rules
        // In some cases, ESLint provides a rule itself, but it doesn't support TypeScript syntax; either it crashes, or
        // it ignores the syntax, or it falsely reports against it. In these cases, we create what we call an extension
        // rule; a rule within our plugin that has the same functionality, but also supports TypeScript.

        // You must disable the base rule to avoid duplicate/incorrect errors. TODO: Is that still necessary?

        // Enforce consistent brace style for blocks  🔧
        'brace-style': 'off',
        '@typescript-eslint/brace-style': [ 'error', 'stroustrup', { allowSingleLine: true } ],

        // Require or disallow trailing commas  🔧
        'comma-dangle': 'off',
        '@typescript-eslint/comma-dangle': 'error',

        // Enforce consistent spacing before and after commas  🔧
        'comma-spacing': 'off',
        '@typescript-eslint/comma-spacing': 'error',

        // Enforce default parameters to be last
        'default-param-last': 'off',
        '@typescript-eslint/default-param-last': 'error',

        // Enforce dot notation whenever possible 🔒 🔧 💭
        'dot-notation': 'off',
        '@typescript-eslint/dot-notation': 'error',

        // Require or disallow spacing between function identifiers and their invocations  🔧
        'func-call-spacing': 'off',
        '@typescript-eslint/func-call-spacing': 'error',

        // Enforce consistent indentation  🔧
        indent: 'off',
        '@typescript-eslint/indent': 'off', // This rule has 151023 failures, perhaps it is incompatible with our formatting

        // Require or disallow initialization in variable declarations
        'init-declarations': 'off',
        '@typescript-eslint/init-declarations': 'off', // 237 Failures

        // Enforce consistent spacing before and after keywords  🔧
        'keyword-spacing': 'off',
        '@typescript-eslint/keyword-spacing': [ 'error', { // TODO: Check this rule
          before: true,
          after: true,
          overrides: {
            case: { after: true }, // default
            switch: { after: false },
            catch: { after: false }
          }
        } ],

        // Require or disallow an empty line between class members  🔧
        'lines-between-class-members': 'off',
        '@typescript-eslint/lines-between-class-members': 'off', // Probably leave this off, it has 2775 failures

        // Disallow generic Array constructors ✅ 🔧
        'no-array-constructor': 'off',
        '@typescript-eslint/no-array-constructor': 'error',

        // Disallow duplicate class members
        'no-dupe-class-members': 'off',
        '@typescript-eslint/no-dupe-class-members': 'error',

        // Disallow duplicate imports
        'no-duplicate-imports': 'off',
        '@typescript-eslint/no-duplicate-imports': 'off', // TODO: Deprecated. Investigate this instead https://github.com/import-js/eslint-plugin-import/blob/HEAD/docs/rules/no-duplicates.md

        // Disallow empty functions ✅
        'no-empty-function': 'off',
        '@typescript-eslint/no-empty-function': 'error',

        // Disallow unnecessary parentheses  🔧
        'no-extra-parens': 'off',
        '@typescript-eslint/no-extra-parens': 'off', // we find that extraneous parentheses sometimes improve readability

        // Disallow unnecessary semicolons ✅ 🔧
        'no-extra-semi': 'off',
        '@typescript-eslint/no-extra-semi': 'error',

        // Disallow the use of eval()-like methods ✅  💭
        'no-implied-eval': 'off',
        '@typescript-eslint/no-implied-eval': 'off',

        // Disallow this keywords outside of classes or class-like objects
        'no-invalid-this': 'off',
        '@typescript-eslint/no-invalid-this': 'error',

        // Disallow function declarations that contain unsafe references inside loop statements
        'no-loop-func': 'off',
        '@typescript-eslint/no-loop-func': 'error',

        // Disallow literal numbers that lose precision ✅
        'no-loss-of-precision': 'off',
        '@typescript-eslint/no-loss-of-precision': 'error',

        // Disallow magic numbers
        'no-magic-numbers': 'off',
        '@typescript-eslint/no-magic-numbers': 'off', // We have many magic numbers

        // Disallow variable redeclaration
        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': 'error',

        // Disallow specified modules when loaded by import
        'no-restricted-imports': 'off',
        '@typescript-eslint/no-restricted-imports': 'error',

        // Disallow variable declarations from shadowing variables declared in the outer scope
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'off', // Disabled for the same reason as in the JS Code. 173 failures

        // Disallow throwing literals as exceptions 🔒  💭
        'no-throw-literal': 'off',
        '@typescript-eslint/no-throw-literal': 'off', // TODO: Enable rule

        // Disallow unused expressions
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-expressions': 'off', // See notes below

        // Disallow unused variables ✅
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [ 'error', {

          // We don't want to turn this on because of the example in https://github.com/phetsims/chipper/issues/1230#issuecomment-1185843199
          args: 'none'
        } ],

        // Disallow the use of variables before they are defined
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': 'off', // We often declare auxiliary classes at the bottom of a file, which are used in the primary class

        // Disallow unnecessary constructors 🔒
        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': 'off', // We determined the useless constructors are good for documentation and clarity.

        // Enforce consistent spacing inside braces  🔧
        'object-curly-spacing': 'off',
        '@typescript-eslint/object-curly-spacing': [ 'error', 'always' ],

        // Require or disallow padding lines between statements  🔧 🛠
        'padding-line-between-statements': 'off',
        '@typescript-eslint/padding-line-between-statements': 'error',

        // Enforce the consistent use of either backticks, double, or single quotes  🔧
        quotes: 'off',
        '@typescript-eslint/quotes': [ 'error', 'single' ],

        // Disallow async functions which have no await expression ✅  💭
        'require-await': 'off',
        '@typescript-eslint/require-await': 'off',

        // Enforce consistent returning of awaited values  🔧 🛠 💭
        'return-await': 'off',
        '@typescript-eslint/return-await': 'off', // TODO: Enable rule

        // Require or disallow semicolons instead of ASI  🔧
        semi: 'off',
        '@typescript-eslint/semi': [ 'error', 'always' ],

        // Enforce consistent spacing before blocks  🔧
        'space-before-blocks': 'off',
        '@typescript-eslint/space-before-blocks': 'error',

        // Enforce consistent spacing before function parenthesis  🔧
        'space-before-function-paren': 'off',
        '@typescript-eslint/space-before-function-paren': [ 'error', {
          anonymous: 'never',
          named: 'never',
          asyncArrow: 'always'
        } ],

        // Require spacing around infix operators  🔧
        'space-infix-ops': 'off',
        '@typescript-eslint/space-infix-ops': 'error',

        ////////////////////////////////////////////////////////////////////////
        // Custom TypeScript Rules
        'bad-typescript-text': 'error',

        'no-simple-type-checking-assertions': 'error',

        // Custom return type rule that only requires for methods. The includes return type was too overarching.
        'explicit-method-return-type': 'error',

        // Variables that are Properties should end in "Property", like const myProperty = new Property();
        'require-property-suffix': 'error',

        // Static fields should have the 'readonly' modifier
        'uppercase-statics-should-be-readonly': 'error'
      }
    }, {
      files: [
        '**/*Tests.js',
        '**/*tests.js'
      ],
      rules: {

        // Test files are allowed to use bracket notation to circumnavigate private member access
        'dot-notation': 'off'
      }
    }, {
      files: [
        '**/*Tests.ts',
        '**/*tests.ts'
      ],
      rules: {

        // Test files are allowed to use bracket notation to circumnavigate private member access. Typescript
        // doesn't complain when accessing a private member this way as an intentional "escape hatch".
        // Decision in https://github.com/phetsims/chipper/issues/1295, and see https://github.com/microsoft/TypeScript/issues/19335
        '@typescript-eslint/dot-notation': 'off'
      }
    }
  ],

  reportUnusedDisableDirectives: true,

  // The rules are organized like they are in the list at https://eslint.org/docs/rules/
  // First by type, then alphabetically within type
  // Explicitly list all rules so it is easy to see what's here and to keep organized
  rules: {

    ////////////////////////////////////////////////////////////////////
    // Possible Problems
    // These rules relate to possible logic errors in code:

    // Enforce return statements in callbacks of array methods
    'array-callback-return': 'error',

    // Require `super()` calls in constructors
    'constructor-super': 'error',

    // Enforce "for" loop update clause moving the counter in the right direction.
    'for-direction': 'error',

    // Enforce `return` statements in getters
    'getter-return': 'error',

    // Disallow using an async function as a Promise executor
    'no-async-promise-executor': 'error',

    // Disallow `await` inside of loops
    'no-await-in-loop': 'off', // We use await in loops all the time in build tools

    // Disallow reassigning class members
    'no-class-assign': 'error',

    // Disallow comparing against -0
    'no-compare-neg-zero': 'error',

    // Disallow assignment operators in conditional expressions
    'no-cond-assign': 'error',

    // Disallow reassigning `const` variables
    'no-const-assign': 'error',

    // Disallow expressions where the operation doesn't affect the value
    'no-constant-binary-expression': 'error',

    // Disallow constant expressions in conditions
    'no-constant-condition': 'error',

    // Disallow returning value from constructor
    'no-constructor-return': 'error',

    // Disallow control characters in regular expressions
    'no-control-regex': 'error',

    // Disallow the use of `debugger`
    'no-debugger': 'error',

    // Disallow duplicate arguments in `function` definitions
    'no-dupe-args': 'error',

    // Disallow duplicate class members
    'no-dupe-class-members': 'error',

    // Disallow duplicate conditions in if-else-if chains
    'no-dupe-else-if': 'error',

    // Disallow duplicate keys in object literals
    'no-dupe-keys': 'error',

    // Disallow duplicate case labels
    'no-duplicate-case': 'error',

    // Disallow duplicate module imports
    'no-duplicate-imports': 'off', // WebStorm typically tells us if we have duplicate imports, and we sometimes add 2 imports from scenery due to its export pattern

    // Disallow empty character classes in regular expressions
    'no-empty-character-class': 'error',

    // Disallow empty destructuring patterns
    'no-empty-pattern': 'error',

    // Disallow reassigning exceptions in `catch` clauses
    'no-ex-assign': 'error',

    // Disallow fallthrough of `case` statements
    'no-fallthrough': 'error',

    // Disallow reassigning `function` declarations
    'no-func-assign': 'error',

    // Disallow assigning to imported bindings
    'no-import-assign': 'error',

    // Disallow variable or `function` declarations in nested blocks
    'no-inner-declarations': 'error',

    // Disallow invalid regular expression strings in `RegExp` constructors
    'no-invalid-regexp': 'error',

    // Disallow irregular whitespace
    'no-irregular-whitespace': 'error',

    // Disallow literal numbers that lose precision
    'no-loss-of-precision': 'error',

    // Disallow characters which are made with multiple code points in character
    // class syntax
    'no-misleading-character-class': 'error',

    // Disallow `new` operators with the `Symbol` object
    'no-new-symbol': 'error',

    // Disallow calling global object properties as functions
    'no-obj-calls': 'error',

    // Disallow returning values from Promise executor functions
    'no-promise-executor-return': 'off', // We turn this rule off so you can use an arrow function as an executor

    // Disallow calling some `Object.prototype` methods directly on objects
    'no-prototype-builtins': 'off', // We prefer `foo.hasOwnProperty("bar");` to `Object.prototype.hasOwnProperty.call(foo, "bar");`

    // Disallow assignments where both sides are exactly the same
    'no-self-assign': 'error',

    // Disallow comparisons where both sides are exactly the same
    'no-self-compare': 'error',

    // Disallow returning values from setters
    'no-setter-return': 'error',

    // Disallow sparse arrays
    'no-sparse-arrays': 'error',

    // Disallow template literal placeholder syntax in regular strings
    'no-template-curly-in-string': 'error',

    // Disallow `this`/`super` before calling `super()` in constructors
    'no-this-before-super': 'error',

    // Disallow the use of undeclared variables unless mentioned in `/*global */` comments
    'no-undef': 'error',

    // Disallow confusing multiline expressions
    'no-unexpected-multiline': 'error', // Avoid code that looks like two expressions but is actually one

    // Disallow unmodified loop conditions
    'no-unmodified-loop-condition': 'error',

    // Disallow unreachable code after `return`, `throw`, `continue`, and `break` statements
    'no-unreachable': 'error',

    // Disallow loops with a body that allows only one iteration
    'no-unreachable-loop': 'error',

    // Disallow control flow statements in `finally` blocks
    'no-unsafe-finally': 'error',

    // Disallow negating the left operand of relational operators
    'no-unsafe-negation': 'error',

    // Disallow use of optional chaining in contexts where the `undefined` value is not allowed
    'no-unsafe-optional-chaining': 'error',

    // Disallow unused private class members
    'no-unused-private-class-members': 'error',

    // Disallow unused variables
    'no-unused-vars': [ // Overridden to allow unused args
      'error',
      {
        vars: 'all',
        args: 'none'
      }
    ],

    // Disallow the use of variables before they are defined
    'no-use-before-define': 'off', // We often declare auxiliary classes at the bottom of a file, which are used in the primary class

    // Disallow useless backreferences in regular expressions
    'no-useless-backreference': 'error',

    // Disallow assignments that can lead to race conditions due to usage of `await` or `yield`
    'require-atomic-updates': 'off', // TODO: Enable: 6 fails, can we turn this on? see https://github.com/phetsims/rosetta/issues/265

    // Require calls to `isNaN()` when checking for `NaN`
    'use-isnan': 'error',

    // Enforce comparing `typeof` expressions against valid strings
    'valid-typeof': 'error',

    ////////////////////////////////////////////////////////////////
    // Suggestions
    // These rules suggest alternate ways of doing things:

    // Enforce getter and setter pairs in objects and classes
    'accessor-pairs': 'off', // Only 17 fails, but I'm not sure we need this.  Perhaps once it bites us we will change our mind?

    // Require braces around arrow function bodies
    'arrow-body-style': 'off', // OK to have braces or not braces

    // Enforce the use of variables within the scope they are defined
    'block-scoped-var': 'off', // We have too much old code with var i being used across several loops.

    // Enforce camelcase naming convention
    camelcase: 'off', // 3512 occurrences March 2021

    // Enforce or disallow capitalization of the first letter of a comment
    'capitalized-comments': 'off',

    // Enforce that class methods utilize `this`
    'class-methods-use-this': 'off', // We have many overrideable methods that just throw an error

    // Enforce a maximum cyclomatic complexity allowed in a program
    complexity: 'off', // We have around 242 offenders as of March, 2021

    // Require `return` statements to either always or never specify values
    'consistent-return': 'error',

    // Enforce consistent naming when capturing the current execution context
    'consistent-this': [ 'error', 'self' ],

    // Enforce consistent brace style for all control statements
    curly: 'error',

    // Require `default` cases in `switch` statements
    'default-case': 'error',

    // Enforce default clauses in switch statements to be last
    'default-case-last': 'error',

    // Enforce default parameters to be last
    'default-param-last': 'error',

    // Enforce dot notation whenever possible
    'dot-notation': 'error',

    // Require the use of `===` and `!==`
    eqeqeq: 'error',

    // Require function names to match the name of the variable or property to which they are assigned
    'func-name-matching': [ 'error', 'always', {
      includeCommonJSModuleExports: false,
      considerPropertyDescriptor: true
    } ],

    // Require or disallow named `function` expressions
    'func-names': 'off', // we sometimes name our functions for debugging

    // Enforce the consistent use of either `function` declarations or expressions
    'func-style': 'off', // 1179 occurrences on March 2021

    // Require grouped accessor pairs in object literals and classes
    'grouped-accessor-pairs': 'off', // In scenery, we group all the getters together, then the setters together

    // Require `for-in` loops to include an `if` statement
    'guard-for-in': 'off', // This hasn't bit us yet

    // Disallow specified identifiers
    'id-denylist': 'error',

    // Enforce minimum and maximum identifier lengths
    'id-length': 'off',

    // Require identifiers to match a specified regular expression
    'id-match': 'error',

    // Require or disallow initialization in variable declarations
    'init-declarations': 'off', // 1286 failures as of March 2021

    // Enforce a maximum number of classes per file
    'max-classes-per-file': 'off', // have as many as you need!

    // Enforce a maximum depth that blocks can be nested
    'max-depth': 'off', // Go for it!

    // Enforce a maximum number of lines per file
    'max-lines': 'off', // Go for it!

    // Enforce a maximum number of lines of code in a function
    'max-lines-per-function': 'off', // Go for it!

    // Enforce a maximum depth that callbacks can be nested
    'max-nested-callbacks': 'error',

    // Enforce a maximum number of parameters in function definitions
    'max-params': 'off',

    // Enforce a maximum number of statements allowed in function blocks
    'max-statements': 'off',

    // Enforce a particular style for multiline comments
    'multiline-comment-style': 'off',

    // Require constructor names to begin with a capital letter
    'new-cap': [ 'error', {
      newIsCap: true,
      newIsCapExceptionPattern: '^(options|this|window)\\.\\w+', // Allow constructors to be passed through options.
      newIsCapExceptions: [ 'rsync', 'jimp', 'Math.seedrandom' ],
      capIsNew: false,
      capIsNewExceptions: [ 'Immutable.Map', 'Immutable.Set', 'Immutable.List' ]
    } ],

    // Disallow the use of `alert`, `confirm`, and `prompt`
    'no-alert': 'off', // We sometimes use this when necessary

    // Disallow `Array` constructors
    'no-array-constructor': 'error',

    // Disallow bitwise operators
    'no-bitwise': 'error',

    // Disallow the use of `arguments.caller` or `arguments.callee`
    'no-caller': 'error',

    // Disallow lexical declarations in case clauses
    'no-case-declarations': 'error',

    // Disallow arrow functions where they could be confused with comparisons
    'no-confusing-arrow': 'off', // 31 occurrences, didn't seem too bad

    // Disallow the use of `console`
    'no-console': 'off', // We like to be able to commit console.log

    // Disallow `continue` statements
    'no-continue': 'off', // 57 continues as of March 2021

    // Disallow deleting variables
    'no-delete-var': 'error',

    // Disallow division operators explicitly at the beginning of regular expressions
    'no-div-regex': 'error',

    // Disallow `else` blocks after `return` statements in `if` statements
    'no-else-return': 'off', // Allow the extra else for symmetry

    // Disallow empty block statements
    'no-empty': 'error',

    // Disallow empty functions
    'no-empty-function': 'off', // It is natural and convenient to specify empty functions instead of having to share a lodash _.noop

    // Disallow `null` comparisons without type-checking operators
    'no-eq-null': 'error',

    // Disallow the use of `eval()`
    'no-eval': 'error',

    // Disallow extending native types
    'no-extend-native': 'error',

    // Disallow unnecessary calls to `.bind()`
    'no-extra-bind': 'error',

    // Disallow unnecessary boolean casts
    'no-extra-boolean-cast': 'error',

    // Disallow unnecessary labels
    'no-extra-label': 'error',

    // Disallow unnecessary semicolons
    'no-extra-semi': 'error',

    // Disallow leading or trailing decimal points in numeric literals
    'no-floating-decimal': 'error',

    // Disallow assignments to native objects or read-only global variables
    'no-global-assign': 'error',

    // Disallow shorthand type conversions
    'no-implicit-coercion': 'off', // We like using !!value and number+''.  Maybe one day we will turn this rule on

    // Disallow declarations in the global scope
    'no-implicit-globals': 'error',

    // Disallow the use of `eval()`-like methods
    'no-implied-eval': 'error',

    // Disallow inline comments after code
    'no-inline-comments': 'off',

    // Disallow use of `this` in contexts where the value of `this` is `undefined`
    'no-invalid-this': 'off', // We have too much old code that uses functions with this (outside of classes)

    // Disallow the use of the `__iterator__` property
    'no-iterator': 'error',

    // Disallow labels that share a name with a variable
    'no-label-var': 'error',

    // Disallow labeled statements
    'no-labels': 'error',

    // Disallow unnecessary nested blocks
    'no-lone-blocks': 'off', // Even though lone blocks are currently rare for our project, we agree they are appropriate in some situations.  Details are in https://github.com/phetsims/chipper/issues/1026

    // Disallow `if` statements as the only statement in `else` blocks
    'no-lonely-if': 'off', // Sometimes this seems more readable or symmetric

    // Disallow function declarations that contain unsafe references inside loop statements
    'no-loop-func': 'off', // It seems we are dealing with this safely, we have 38 occurrences on March 2021

    // Disallow magic numbers
    'no-magic-numbers': 'off', // We have many magic numbers

    // Disallow mixed binary operators
    'no-mixed-operators': 'off',  // 3+2/4 should be allowed

    // Disallow use of chained assignment expressions
    'no-multi-assign': [ 'error', { ignoreNonDeclaration: true } ],

    // Disallow multiline strings
    'no-multi-str': 'error',

    // Disallow negated conditions
    'no-negated-condition': 'off', // sometimes a negated condition is clearer

    // Disallow nested ternary expressions
    'no-nested-ternary': 'off', // Go for it!

    // Disallow `new` operators outside of assignments or comparisons
    'no-new': 'error',

    // Disallow `new` operators with the `Function` object
    'no-new-func': 'error',

    // Disallow `Object` constructors
    'no-new-object': 'error',

    // Disallow `new` operators with the `String`, `Number`, and `Boolean` objects
    'no-new-wrappers': 'error',

    // Disallow `\8` and `\9` escape sequences in string literals
    'no-nonoctal-decimal-escape': 'error',

    // Disallow octal literals
    'no-octal': 'error',

    // Disallow octal escape sequences in string literals
    'no-octal-escape': 'error',

    // Disallow reassigning `function` parameters
    'no-param-reassign': 'off', // We reassign options frequently TODO: Revisit this

    // Disallow the unary operators `++` and `--`
    'no-plusplus': 'off',

    // Disallow the use of the `__proto__` property
    'no-proto': 'error',

    // Disallow variable redeclaration
    'no-redeclare': 'error',

    // Disallow multiple spaces in regular expressions
    'no-regex-spaces': 'error',

    // Disallow specified names in exports
    'no-restricted-exports': 'error',

    // Disallow specified global variables
    'no-restricted-globals': 'error',

    // Disallow specified modules when loaded by `import`
    'no-restricted-imports': 'error',

    // Disallow certain properties on certain objects
    'no-restricted-properties': 'error',

    // Disallow specified syntax
    'no-restricted-syntax': [
      'off',

      { // We allow for...in loops at dev discretion.
        selector: 'ForInStatement',
        message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.'
      },
      { // We allow for...of loops at dev discretion.
        selector: 'ForOfStatement',
        message: 'iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.'
      },
      { // Duplicate of the no-labels rule
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.'
      },
      { // Duplicate of no-with rule
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.'
      }
    ],

    // Disallow assignment operators in `return` statements
    'no-return-assign': 'error',

    // Disallow unnecessary `return await`
    'no-return-await': 'error',

    // Disallow `javascript:` urls
    'no-script-url': 'error',

    // Disallow comma operators
    'no-sequences': 'error',

    // Disallow variable declarations from shadowing variables declared in the outer scope
    'no-shadow': 'off', // We have 462 shadows as of March, 2021

    // Disallow identifiers from shadowing restricted names
    'no-shadow-restricted-names': 'error',

    // Disallow ternary operators
    'no-ternary': 'off', // PhET loves the ternary

    // Disallow throwing literals as exceptions
    'no-throw-literal': 'error',

    // Disallow initializing variables to `undefined`
    'no-undef-init': 'error',

    // Disallow the use of `undefined` as an identifier
    'no-undefined': 'off', // 608 fails as of March 2021

    // Disallow dangling underscores in identifiers
    'no-underscore-dangle': 'off', // We often use this for private variables

    // Disallow ternary operators when simpler alternatives exist
    'no-unneeded-ternary': 'error',

    // Disallow unused expressions
    'no-unused-expressions': 'off', // This blocks things like circuitNode && circuitNode.circuit.circuitChangedEmitter.removeListener( updateText );

    // Disallow unused labels
    'no-unused-labels': 'error',

    // Disallow unnecessary calls to `.call()` and `.apply()`
    'no-useless-call': 'error',

    // Disallow unnecessary `catch` clauses
    'no-useless-catch': 'error',

    // Disallow unnecessary computed property keys in objects and classes
    'no-useless-computed-key': 'error',

    // Disallow unnecessary concatenation of literals or template literals
    'no-useless-concat': 'error',

    // Disallow unnecessary constructors
    'no-useless-constructor': 'off', // We determined the useless constructors are good for documentation and clarity.

    // Disallow unnecessary escape characters
    'no-useless-escape': 'error',

    // Disallow renaming import, export, and destructured assignments to the same name
    'no-useless-rename': 'error',

    // Disallow redundant return statements
    'no-useless-return': 'error',

    // Require `let` or `const` instead of `var`
    'no-var': 'error',

    // Disallow `void` operators
    'no-void': 'error',

    // Disallow specified warning terms in comments
    'no-warning-comments': 'off', // We don't want TODOs to be lint errors

    // Disallow `with` statements
    'no-with': 'error',

    // Require or disallow method and property shorthand syntax for object literals
    'object-shorthand': [ 'off', 'never' ], // PhET has a rule phet-object-shorthand that detects this in object literals

    // Enforce variables to be declared either together or separately in functions
    'one-var': [ 'error', 'never' ], // See #390

    // Require or disallow newlines around variable declarations
    'one-var-declaration-per-line': [ 'error', 'always' ],

    // Require or disallow assignment operator shorthand where possible
    'operator-assignment': 'off', // Operator assignment can often be harder to read

    // Require using arrow functions for callbacks
    'prefer-arrow-callback': 'error',

    // Require `const` declarations for variables that are never reassigned after declared
    'prefer-const': [ // error when let is used but the variable is never reassigned, see https://github.com/phetsims/tasks/issues/973
      'error',
      {
        destructuring: 'any',
        ignoreReadBeforeAssign: false
      }
    ],

    // Require destructuring from arrays and/or objects
    'prefer-destructuring': 'off', // const {CURVE_X_RANGE} = CalculusGrapherConstants; seems worse than const CURVE_X_RANGE = CalculusGrapherConstants.CURVE_X_RANGE;

    // Disallow the use of `Math.pow` in favor of the `**` operator
    'prefer-exponentiation-operator': 'off', // Math.pow() seems very clear.

    // Enforce using named capture group in regular expression
    'prefer-named-capture-group': 'off', // We have many occurrences in yotta/js/apacheParsing.js

    // Disallow `parseInt()` and `Number.parseInt()` in favor of binary, octal, and hexadecimal literals
    'prefer-numeric-literals': 'error',

    // Disallow use of `Object.prototype.hasOwnProperty.call()` and prefer use of `Object.hasOwn()`
    'prefer-object-has-own': 'error',

    // Disallow using Object.assign with an object literal as the first argument and prefer the use of object spread instead.
    'prefer-object-spread': 'off', // The fix for this says "unexpected token", so let's go without it.

    // Require using Error objects as Promise rejection reasons
    'prefer-promise-reject-errors': 'error',

    // Disallow use of the `RegExp` constructor in favor of regular expression literals
    'prefer-regex-literals': 'off', // new RegExp() looks natural to me

    // Require rest parameters instead of `arguments`
    'prefer-rest-params': 'error',

    // Require spread operators instead of `.apply()`
    'prefer-spread': 'error',

    // Require template literals instead of string concatenation
    'prefer-template': 'off', // We decided it is convenient to sometimes use string concatenation, see discussion in https://github.com/phetsims/chipper/issues/1027

    // require quotes around object literal property names
    'quote-props': [ 'error', 'as-needed', { keywords: false, unnecessary: true, numbers: false } ],

    // Enforce the consistent use of the radix argument when using `parseInt()`
    radix: 'error',

    // Disallow async functions which have no `await` expression
    'require-await': 'off', // 59 errors as of 7/21, but we will keep off, see https://github.com/phetsims/chipper/issues/1028

    // Enforce the use of `u` flag on RegExp
    'require-unicode-regexp': 'off', // TODO: Discuss: 272 fails or so, https://github.com/phetsims/chipper/issues/1029 is there a good reason for this rule?

    // Require generator functions to contain `yield`
    'require-yield': 'error',

    // Enforce sorted import declarations within modules
    'sort-imports': 'off', // Webstorm and ESLint sorting rules don't align

    // Require object keys to be sorted
    'sort-keys': 'off',

    // Require variables within the same declaration block to be sorted
    'sort-vars': 'off',

    // Enforce consistent spacing after the `//` or `/*` in a comment
    'spaced-comment': 'off',

    // Require or disallow strict mode directives
    strict: 'error',

    // Require symbol descriptions
    'symbol-description': 'error',

    // Require `var` declarations be placed at the top of their containing scope
    'vars-on-top': 'off',

    // Require or disallow "Yoda" conditions
    yoda: 'error',

    ////////////////////////////////////////////////////////////
    // These rules care about how the code looks rather than how it executes:
    // Layout & Formatting

    // Enforce linebreaks after opening and before closing array brackets
    'array-bracket-newline': 'off',

    // Enforce consistent spacing inside array brackets
    'array-bracket-spacing': [ 'error', 'always' ],

    // Enforce line breaks after each array element
    'array-element-newline': 'off',

    // Require parentheses around arrow function arguments
    'arrow-parens': [ 'error', 'as-needed' ],

    // Enforce consistent spacing before and after the arrow in arrow functions
    'arrow-spacing': 'error',

    // Disallow or enforce spaces inside of blocks after opening block and before closing block
    'block-spacing': 'off', // Our code style supports e.g.,: if ( !isFinite( newState.getTotalEnergy() ) ) { throw new Error( 'not finite' );}

    // Enforce consistent brace style for blocks
    'brace-style': [ 'error', 'stroustrup', { allowSingleLine: true } ],

    // Require or disallow trailing commas
    'comma-dangle': 'error', // see https://github.com/phetsims/tasks/issues/940

    // Enforce consistent spacing before and after commas
    'comma-spacing': [ 'error', { before: false, after: true } ],

    // Enforce consistent comma style
    'comma-style': [ 'error', 'last', { // good
      exceptions: {
        ArrayExpression: false,
        ArrayPattern: false,
        ArrowFunctionExpression: false,
        CallExpression: false,
        FunctionDeclaration: false,
        FunctionExpression: false,
        ImportDeclaration: false,
        ObjectExpression: false,
        ObjectPattern: false,
        VariableDeclaration: false,
        NewExpression: false
      }
    } ],

    // Enforce consistent spacing inside computed property brackets
    'computed-property-spacing': [ 'error', 'always' ],

    // Enforce consistent newlines before and after dots
    'dot-location': 'off', // We use WebStorm formatting which moves lower dots to the left

    // Require or disallow newline at the end of files
    'eol-last': 'off', // 5000 problems in March 2021.  SR would prefer 'eol-last': [ 'error', 'never' ], in his code

    // Require or disallow spacing between function identifiers and their invocations
    'func-call-spacing': [ 'error', 'never' ],

    // Enforce line breaks between arguments of a function call
    'function-call-argument-newline': [ 'off', 'consistent' ], // Not PhET's style

    // Enforce consistent line breaks inside function parentheses
    'function-paren-newline': 'off', // we often prefer parameters on the same line

    // Enforce consistent spacing around `*` operators in generator functions
    'generator-star-spacing': 'error',

    // Enforce the location of arrow function bodies
    'implicit-arrow-linebreak': 'off', // OK to line break in arrow functions if it improves readability.

    // Enforce consistent indentation
    indent: 'off',

    // Enforce the consistent use of either double or single quotes in JSX attributes
    'jsx-quotes': 'error',

    // Enforce consistent spacing between keys and values in object literal properties
    'key-spacing': [ 'error', { beforeColon: false, afterColon: true } ],

    // Enforce consistent spacing before and after keywords
    'keyword-spacing': [ 'error', {
      before: true,
      after: true,
      overrides: {
        case: { after: true }, // default
        switch: { after: false },
        catch: { after: false }
      }
    } ],

    // Enforce position of line comments
    'line-comment-position': 'off',

    // Enforce consistent linebreak style
    'linebreak-style': 'off', // Windows may check out a different line style than mac, so we cannot test this on local working copies cross-platform

    // Require empty lines around comments
    'lines-around-comment': 'off', // SR Would like this rule enabled in his repos like so: 'lines-around-comment': [ 'error', { beforeLineComment: true } ]

    // Require or disallow an empty line between class members
    'lines-between-class-members': [ 'error', 'always', { exceptAfterSingleLine: true } ],

    // Enforce a maximum line length
    'max-len': 'off', // Not a strict rule

    // Enforce a maximum number of statements allowed per line
    'max-statements-per-line': 'off', // 700+ occurrences in March 2021

    // Enforce newlines between operands of ternary expressions
    'multiline-ternary': 'off', // We use all styles of ternaries

    // Enforce or disallow parentheses when invoking a constructor with no arguments
    'new-parens': 'error',

    // Require a newline after each call in a method chain
    'newline-per-chained-call': 'off', // should be flexible

    // Disallow unnecessary parentheses
    'no-extra-parens': 'off', // we find that extraneous parentheses sometimes improve readability

    // Disallow mixed spaces and tabs for indentation
    'no-mixed-spaces-and-tabs': 'error',

    // Disallow multiple spaces
    'no-multi-spaces': [ 'error', { ignoreEOLComments: true } ],

    // Disallow multiple empty lines
    'no-multiple-empty-lines': [ 'error', { max: 2, maxBOF: 0, maxEOF: 1 } ],

    // Disallow all tabs
    'no-tabs': 'error',

    // Disallow trailing whitespace at the end of lines
    'no-trailing-spaces': [ 'error', { skipBlankLines: true, ignoreComments: true } ],

    // Disallow whitespace before properties
    'no-whitespace-before-property': 'error',

    // Enforce the location of single-line statements
    'nonblock-statement-body-position': [ 'error', 'beside', { overrides: {} } ],

    // Enforce consistent line breaks after opening and before closing braces
    'object-curly-newline': 'error',

    // Enforce consistent spacing inside braces
    'object-curly-spacing': [ 'error', 'always' ],

    // Enforce placing object properties on separate lines
    'object-property-newline': 'off',

    // Enforce consistent linebreak style for operators
    'operator-linebreak': 'off',

    // Require or disallow padding within blocks
    'padded-blocks': 'off', // 109k fails

    // Require or disallow padding lines between statements
    'padding-line-between-statements': 'error',

    // Enforce the consistent use of either backticks, double, or single quotes
    quotes: [ 'error', 'single' ],

    // Enforce spacing between rest and spread operators and their expressions
    'rest-spread-spacing': 'error',

    // Require or disallow semicolons instead of ASI
    semi: [ 'error', 'always' ],

    // Enforce consistent spacing before and after semicolons
    'semi-spacing': [ 'error', { before: false, after: true } ],

    // Enforce location of semicolons
    'semi-style': [ 'error', 'last' ],

    // Enforce consistent spacing before blocks
    'space-before-blocks': 'error',

    // Enforce consistent spacing before `function` definition opening parenthesis
    'space-before-function-paren': [ 'error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always'
    } ],

    // Enforce consistent spacing inside parentheses
    'space-in-parens': [ 'error', 'always' ],

    // Require spacing around infix operators
    'space-infix-ops': 'error',

    // Enforce consistent spacing before or after unary operators
    'space-unary-ops': [ 'error', {
      words: true,
      nonwords: false,
      overrides: {}
    } ],

    // Enforce spacing around colons of switch statements
    'switch-colon-spacing': [ 'error', { after: true, before: false } ],

    // Require or disallow spacing around embedded expressions of template strings
    'template-curly-spacing': 'error',

    // Require or disallow spacing between template tags and their literals
    'template-tag-spacing': [ 'error', 'never' ],

    // Require or disallow Unicode byte order mark (BOM)
    'unicode-bom': [ 'error', 'never' ],

    // Require parentheses around immediate `function` invocations
    'wrap-iife': 'off', // Not our style

    // Require parenthesis around regex literals
    'wrap-regex': 'off', // It already seems pretty ambiguous to me, but then again we only have 17 occurrences at the moment.

    // Require or disallow spacing around the `*` in `yield*` expressions
    'yield-star-spacing': 'error',

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Custom Rules
    //

    'bad-text': 'error',

    // Custom rule for checking the copyright.
    copyright: 'error',

    // Custom rule for checking TODOs have issues
    'todo-should-have-issue': 'error',

    // Custom rule for ensuring that images and text use scenery node
    'no-html-constructors': 'error',

    // Custom rule for avoiding instanceof Array.
    'no-instanceof-array': 'error',

    // Custom rule for keeping import statements on a single line.
    'single-line-import': 'error',

    // method declarations must have a visibility annotation
    'visibility-annotation': 'error',

    // key and value arguments to namespace.register() must match
    'namespace-match': 'error',

    // phet-specific require statement rules
    'require-statement-match': 'error',
    'phet-io-require-contains-ifphetio': 'error',

    // Require @public/@private for this.something = result;
    'property-visibility-annotation': 'off',
    'no-property-in-require-statement': 'error',

    // never allow object shorthand for properties, functions are ok.
    'phet-object-shorthand': 'error',

    // disallow space between function identifier and application
    'no-spaced-func': 'error',

    // a default import variable name should be the same as the filename
    'default-import-match-filename': 'error',

    // When the default export of a file is a class, it should have a namespace register call
    'default-export-class-should-register-namespace': 'error',

    // Importing the view from the model, uh oh. TODO: 51 errors before turning on, https://github.com/phetsims/chipper/issues/1385
    'no-view-imported-from-model': 'error'
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  },
  env: {
    browser: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module'
  },
  globals: {

    //=============================================================================================
    // globals that should never be accessed
    //=============================================================================================

    // Using window.event is most likely a bug, instead the event should be passed through via a parameter,
    // discovered in https://github.com/phetsims/scenery/issues/1053
    event: 'off',

    //=============================================================================================
    // read-only globals
    //=============================================================================================

    phet: 'readonly',

    // allow assertions
    assert: 'readonly',

    // allow slow assertions
    assertSlow: 'readonly',

    // decimal.js library
    Decimal: 'readonly',

    phetio: 'readonly',

    // underscore, lodash
    _: 'readonly',

    // jQuery
    $: 'readonly',

    // jQuery for type documentation
    JQuery: 'readonly',

    // JSON diffs
    jsondiffpatch: 'readonly',

    document: 'readonly',

    // for linting Node.js code
    global: 'readonly',

    // QUnit
    QUnit: 'readonly',

    // as used in Gruntfile.js
    module: 'readonly',

    // Misc
    QueryStringMachine: 'readonly',
    QueryStringMachineSchema: 'readonly',

    // Prism is a syntax highlighter that renders code in the browser. It is used for PhET-iO wrappers and for a11y.
    Prism: 'readonly',

    // sole/tween.js
    TWEEN: 'readonly',

    window: 'readonly',

    handlePlaybackEvent: 'readonly',

    pako: 'readonly',

    // define globals for missing Web Audio types, see https://github.com/phetsims/chipper/issues/1214
    OscillatorType: 'readonly',
    AudioContextState: 'readonly',

    // type for QUnit assert
    Assert: 'readonly',

    fetch: 'readonly',

    // React
    React: 'readonly',
    ReactDOM: 'readonly',

    // Deno
    Deno: 'readonly'
  }
};