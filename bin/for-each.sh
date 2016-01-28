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

# cd to the directory where working copy lives
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

# command is all args after the filename
command=${@:2}

 # run the command in each repository directory
for repository in `cat ${WORKING_DIR}/chipper/data/$1 | xargs`
do
  if [ -d "$repository" ]; then
    echo $repository
    cd $repository > /dev/null  # run in the repository directory
    $command                    # run command
    cd ${WORKING_DIR}           # return to the original directory
  else
    echo ">>>>>>>>>>>>>>>> MISSING " $repository
  fi
done
