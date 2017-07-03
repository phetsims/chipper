active-repos is a list of all repositories that you should have checked out if doing common-code refactoring.

active-runnables is a list of all repositories that can be built with chipper and launched from an html file.

active-sims is a list of all simulation repositories that can be built with chipper.  Similar to runnables, but doesn't 
    include repos with test code like sun, scenery-phet, etc.

duplicates/duplicates.txt is a record of `grunt find-duplicates --everything` so we can track duplicates over time.

phet-io is the list of all simulations that are instrumented with PhET-iO features. This list is automatically fuzz
    tested and is used by phetmarks to dictate which sims have wrapper links. See 
    [How to Instrument a PhET Simulation](https://github.com/phetsims/phet-io/blob/master/doc/how-to-instrument-a-phet-simulation-for-phet-io.md)
    for more information.
    
wrappers is the list of all PhET-iO wrappers in the project. They are paths from the git root. This is because most
    wrappers are in the `phet-io-wrappers` repository, but there are some wrappers in dedicated repositories.
