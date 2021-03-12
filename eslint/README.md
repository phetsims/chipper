# ESLint with PhET

## Overview

PhET uses [ESLint](https://eslint.org/) to statically analyze our code, solving several tasks:

- Find logical and syntax errors, eg misspelled variables.
- Ensure code conforms to PhET's style guideline, eg files must start with a copyright notice.
- Ensure code is formatted correctly, eg indentation is two spaces.
- Something else?
- Autofix as many of these issues as possible.

We use these tools at several stages of development:

- Automatically highlighting errors and formatting code in our IDEs as we code.
- Checking code during pre-commit hooks.
- In continuous integration tests in [aqua](https://github.com/phetsims/aqua).
- Elsewhere as well?

## Usage

For developers looking to ensure their changes pass ESLint, the typical entry point
is to run `grunt lint`. See `grunt lint --help` for options. If your code passes
`grunt lint`, then it is good to merge. You can add the `--format` option to achieve 
formatting that comes close to PhET's code standards defined by the Webstorm code style 
[here](https://github.com/phetsims/phet-info/blob/master/ide/idea/phet-idea-codestyle.xml).
That is considered the ground truth for formatting currently, and `--format` attempts to get as close at we can to those
rules.

## Shared Configuration Files

This directory (`chipper/eslint`) contains most of the
[configuration for ESLint](https://eslint.org/docs/user-guide/configuring/).
ESLint uses cascading configuration, similar to CSS, so we can provide an inheritance
tree of configuration settings.

Here is a list of all the available configuration files and why to use them for a repo:

- `.eslintrc.js` is the base set of rules. You probably shouldn't use this directly, instead you should use one
  of the derived configurations below.
- `node_eslintrc.js` expands on the base rules and adds configuration only intended for Node.js code (i.e. `perennial`).
- `sim_eslintrc.js` expands on the base rules and adds configuration intended for code run in sims (think of this as es5 sim rules)
- `sim_eslintrc.js'` expands on the sim rules and adds configuration for sims that have no es5 in them (i.e. `wave-interference`)
- `format_eslintrc.js` contains additional rules used for enforcing code formatting. These are not required, they are just
  recommended.

So here is the hierarchy of chipper's config files. Indentation symbolized the "extends" relationship.

```
format_eslintrc.js
.eslintrc.js
  node_eslintrc.js
  sim_eslintrc.js
```

PhET also uses some custom linting rules to detect PhET-specific errors, such as
ensuring that each file contains a copyright notice. These custom rules live
under the `./rules/` directory.

## Configuring a repo

Each PhET repo specifies which of the above configurations to use. This is
usually specified in the `eslintConfig` section of the repo's `package.json`.
Usually you should use the `extends` keyword to build upon one of the
above configurations. Linting rules specific to the repo can be declared
or modified here. For example see `scenery/package.json`.

If there is a sub-directory that requires specific configuration (or the repo
doesn't have a `package.json`, like `sherpa`), you can
create a file called `.eslintrc.js` in that directory, and specify the
necessary configuration there. For example see `chipper/test/eslintrc.js`.

Before creating a special configuration unique to one repo or sub-directory,
answer these questions:

- Why does this rule apply here but not everywhere?
- May it apply in other places soon, and thus I should just add it to a configuration in `chipper/eslint/`?
- Though it only applies here, is it easier to maintain if we just add it to a default configuration file?

## See Also

- For a discussion of how PhET decided to use ESLint for formatting, see
  https://github.com/phetsims/phet-info/issues/150

- While ESLint can be plugged into many IDEs to perform code formatting automatically, many
  PhET developers use other plugins 
  their IDEs. See https://github.com/phetsims/phet-info/tree/master/ide
