#!/bin/bash
#====================================================================================================
#
# Runs grunt for all simulations.
# Command-line args are passed through to grunt.
# With no args, this runs the default grunt task (build).
#
# Author: Jonathan Olson
# Author: Chris Malley
#
#====================================================================================================

CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}

trap "exit 1" SIGINT

for sim in `cat chipper/data/active-runnables | xargs`
do
  if [ -d "$sim" ]; then
    echo "Building" $sim
    cd $sim                 # build.sh needs to be run from the sim directory
    npm install             # executes quickly when everything is up to date compared to build.sh
    grunt $*                # run grunt with command-line args
    cd ..                   # and back to the original directory
  else
    echo ">>>>>>>>>>>>>>>> MISSING " $sim
  fi
done
