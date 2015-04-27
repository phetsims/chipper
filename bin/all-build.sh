#!/bin/sh
#====================================================================================================
#
# Builds all chipper-like simulations.
# (named all-build because I like build.sh to be tab-completed easily. lazy? yes)
#
# Author: Jonathan Olson
#
#====================================================================================================

CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}

for sim in `cat chipper/data/active-sims | xargs`
do
  if [ -d "$sim" ]; then
    echo "Building" $sim
    cd $sim                 # build.sh needs to be run from the sim directory
    npm install             # executes quickly when everything is up to date compared to build.sh
    grunt $1 # run the build
    cd ..                   # and back to the original directory
  fi
done
