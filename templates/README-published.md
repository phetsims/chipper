{{TITLE}}
=============
"{{TITLE}}" is an educational simulation in HTML5, by <a href="https://phet.colorado.edu/" target="_blank">PhET
Interactive Simulations</a>
at the University of Colorado Boulder. For a description of this simulation, associated resources, and a link to the
published version,
<a href="https://phet.colorado.edu/en/simulation/{{REPOSITORY}}" target="_blank">visit the simulation's web page</a>.

### Try it!

<a href="https://phet.colorado.edu/sims/html/{{REPOSITORY}}/latest/{{REPOSITORY}}_en.html" target="_blank">Click here to
run "{{TITLE}}".</a>

<a href="https://phet.colorado.edu/sims/html/{{REPOSITORY}}/latest/{{REPOSITORY}}_en.html" target="_blank">
<img src="https://raw.githubusercontent.com/phetsims/{{REPOSITORY}}/main/assets/{{REPOSITORY}}-screenshot.png" alt="Screenshot" style="width: 400px;"/>
</a>

### Documentation

The <a href="https://github.com/phetsims/phet-info/blob/main/doc/phet-development-overview.md" target="_blank">PhET
Development Overview</a> is the most complete guide to PhET Simulation Development. This guide includes how to obtain
simulation code and its dependencies, notes about architecture & design, how to test and build the sims, as well as
other important information.

### Quick Start

(1) Clone the simulation and its dependencies:

```
{{CLONE_COMMANDS}}
```

(2) Install dev dependencies:

```
cd chipper
npm install
cd ../perennial-alias
npm install
cd ../{{REPOSITORY}}
npm install
```

(3) Change directory to chipper `cd ../chipper/`, then transpile the code to JavaScript by
running `node js/scripts/transpile.js --watch`. This starts a file-watching process that will automatically transpile
new or changed files.

(4) In a new terminal/command prompt, start an http-server

(5) Open in the browser: `http://localhost/{{REPOSITORY}}/{{REPOSITORY}}_en.html` (You will probably need to modify this
URL based on your HTTP port and relative path.)

#### Optional: Build the simulation into a single file

(1) Change directory to the simulation directory: `cd ../{{REPOSITORY}}`

(2) Build the sim: `grunt --brands=adapted-from-phet`. It is safe to ignore warnings
like `>> WARNING404: Skipping potentially non-public dependency`, which indicate that non-public PhET-iO code is not
being included in the build.

(3) Open in the
browser: `http://localhost/{{REPOSITORY}}/build/adapted-from-phet/{{REPOSITORY}}_en_adapted-from-phet.html` (You will
probably need to modify this URL based on your HTTP port and relative path.)

### Get Involved

Contact us at our Google
Group: <a href="http://groups.google.com/forum/#!forum/developing-interactive-simulations-in-html5" target="_blank">
Developing Interactive Simulations in HTML5</a>

Help us improve, create a <a href="http://github.com/phetsims/{{REPOSITORY}}/issues/new" target="_blank">New Issue</a>

### License

See the <a href="https://github.com/phetsims/{{REPOSITORY}}/blob/main/LICENSE" target="_blank">LICENSE</a>
