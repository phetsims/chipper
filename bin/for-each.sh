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

# Exit immediately on Ctrl-C
trap "exit 1" SIGINT

# verify number of command line args
if [ $# -lt 2 ]; then
  echo "usage: `basename $0` filename command"
  exit 1
fi

# remember the directory where the script was run
RUN_DIR=`pwd`

# cd to working directory
CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}
WORKING_DIR=`pwd` # clean up the path, since it appears in error messages

# filename is the first arg
if [ "${DIR:0:1}" = "/" ]; then
  # absolute path
  filename=$1
else
  # relative path
  filename=${RUN_DIR}/$1

  # if the relative path doesn't exist, default to chipper/data/
  if [ ! -e $filename ]; then
    filename=${WORKING_DIR}/chipper/data/$1
  fi
fi

# verify that input file exists
if [ ! -e $filename ]; then
  echo "$filename does not exist"
  exit 1
fi

# command is all args after the filename
command=${@:2}

# run the command in each repository directory
for repository in `cat $filename | xargs`
do
  if [ -d "$repository" ]; then
    echo $repository
    (cd $repository > /dev/null; $command)
  else
    echo ">>>>>>>>>>>>>>>> MISSING " ${WORKING_DIR}/$repository
  fi
done
