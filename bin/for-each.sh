#!/bin/bash
#====================================================================================================
#
# Visits each repository listed in a file and applies the same command to each.
# The lists are files located in chipper/bin/data, with one repository name on each line of the file.
#
# For example, to print the working directory of all instrumented simulations:
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

# verify number of command line args
if [ $# -lt 2 ]; then
  echo "usage: `basename $0` filename command"
  exit 1
fi

for sim in `cat $CHIPPER_BIN/../data/$1 | xargs`
do
  if [ -d "$sim" ]; then
    echo $sim
    cd $sim > /dev/null     # build.sh needs to be run from the sim directory
    ${@:2}                  # run command with remaining command-line args, skip the file list filename
    cd ..                   # and back to the original directory
  else
    echo ">>>>>>>>>>>>>>>> MISSING " $sim
  fi
done
