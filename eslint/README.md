
## eslint configuration for PhET

### Overview
In general, PhET's eslint configuration can be found in `./.eslintrc.js`. This base configuration specifies the majority
of the rules used in the project, including the custom rules that have been created for the project (see `./rules/`).

Here is a list of all the available configuration files and why to use them for a repo:

* `.eslintrc.js` is the main set of rules, and should be used for browser code that isn't used in sims, see `sim_eslint.js` for sim configuration (i.e. `phetmarks`).
* `node_eslintrc.js` expands on the base rules and adds configuration only intended for Node.js code (i.e. `perennial`).
* `sim_eslint.js` expands on the base rules and adds configuration intended for code run in sims (think of this as es5 sim rules)
* `sim_es6_eslint.js` expands on the sim rules and adds configuration intended for sims that have no es5 in them (i.e. `wave-interference`)
* `sim_es6_eslint_review.js` expands on `sim_es6_eslint.js` and adds rules that could be helpful during a code review

So here is the hierarchy of chipper's config files. Indentation symbolized the "extends" relationship.

```
.eslint.js
  node_eslintrc.js
  sim_eslint.js
    sim_es6_eslint.js
```

The project is set up based on configuration files extending others using the "extends" key. By default, a configuration 
file in a child dir will completely override a parent directory. Be sure appropriately extend, and don't blow away a 
default configuration when you think you are just overriding. 

A few definitions of terms:
* The "base config" file is `chipper/eslint/.eslintrc.js`. All config files should at some point in the chain extend back 
to it. It defines the core rules for the project.
* The "default config" file for a repo is the file that it extends that applies to the whole repository, must be a 
configuration file located in `chipper/eslint/`.

### Usage

In each repo's `package.json`, the key `eslintConfig` specifies the eslint config for the repo, and should extend one of 
the default config files here in `./chipper/eslint`, (described above). 

If the repo needs specific configuration that cannot be filled with the possible configuration files provided, then it
can be added directly to the `eslintConfig` in the repo's `package.json`. i.e. if a repo uses a unique global, then just 
add it in the `package.json`.

If there is a sub directory that requires specific configuration, you should create a file called `.eslintrc.js` in that
directory, and specify the necessary configuration there. Don't forget that you also need to "extend" the default 
configuration too. See `phet-io-wrappers/studio/.eslintrc.js` for an example.

NOTE: before creating a specific configuration file, answer these questions:
  * Why does this rule apply here but not everywhere?
  * May it apply in other places soon, and thus I should just add it to a configuration in `chipper/eslint/`?
  * Though it only applies here, is it easier to maintain if we just add it to a default configuration file.