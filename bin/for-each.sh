#!/bin/bash
#====================================================================================================
#
# Visits each directory in in a list and applies the same command to each.  The lists are drawn
# from chipper/bin/data.  For example, to print the working directory of all instrumented simulations,
# use:
#
# for-each.sh instrumented-sims pwd
#
# Author: Sam Reid
# Author: Jonathan Olson (from work in grunt-all.sh)
# Author: Chris Malley (from work in grunt-all.sh)
#
#====================================================================================================

CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}

# Exit immediately on Ctrl-C
trap "exit 1" SIGINT

for sim in `cat $CHIPPER_BIN/../data/$1 | xargs`
do
  if [ -d "$sim" ]; then
    echo $sim
    cd $sim                 # build.sh needs to be run from the sim directory
    ${@:2}                  # run command with remaining command-line args, skip the file list filename
    cd ..                   # and back to the original directory
  else
    echo ">>>>>>>>>>>>>>>> MISSING " $sim
  fi
done
