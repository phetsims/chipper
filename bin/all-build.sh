#!/bin/sh
#====================================================================================================
#
# Builds all chipper-like simulations.
# This must be run from the main "git" directory (the parent of all simulation/chipper repo directories)
# Usage: chipper/bin/all-build.sh
#                                     (named all-build because I like build.sh to
#                                      be tab-completed easily. lazy? yes)
#
# Author: Jonathan Olson
#
#====================================================================================================

for sim in `cat chipper/bin/data/active-sims | xargs`
do
  if [ -d "$sim" ]; then
    cd $sim                 # build.sh needs to be run from the sim directory
    npm install             # executes quickly when everything is up to date compared to build.sh
    grunt $1 # run the build
    cd ..                   # and back to the original directory
  fi
done
