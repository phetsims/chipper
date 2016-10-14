#!/bin/bash
#====================================================================================================
#
# Visits each repository listed in a file and applies the same command to each.  If the specified file cannot be found
# it will check for a matching file in chipper/bin/data.
#
# For example, to print the working directory of all active repos:
#
# for-each.sh active-repos pwd
#
# Author: Sam Reid
# Author: Chris Malley
# Author: Jonathan Olson (from work in grunt-all.sh)
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
filename=$1
if [ "${filename:0:1}" != "/" ]; then

  # relative path
  filename=${RUN_DIR}/$1

  # if the relative path doesn't exist, default to chipper/data/
  if [ ! -e $filename ]; then
    filename=${WORKING_DIR}/chipper/data/$1
  fi
fi

# verify that input file exists
if [ ! -e $filename ]; then
  echo "$1 does not exist"
  exit 1
fi

# run the command in each repository directory
for repository in `cat $filename | xargs`
do
  if [ -d "$repository" ]; then
    echo $repository
    (cd $repository > /dev/null; "${@:2}") # command is all args after the filename
  else
    echo ">>>>>>>>>>>>>>>> MISSING " ${WORKING_DIR}/$repository
  fi
done
