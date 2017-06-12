#!/bin/bash
#====================================================================================================
#
# Does a 'git pull --rebase' on every active repo.
# Use -p option to handle each repository in parallel.
#
# Author: Jonathan Olson
#
#====================================================================================================

PULL_COMMAND="git pull --rebase"
PARALLEL="false"

# cd to the directory where your git repositories live
CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}

# parse command line options
while getopts ":p" opt; do
  case $opt in
    p)
      PARALLEL="true"
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit
      ;;
  esac
done

# pull each repository
for repo in `cat chipper/data/active-repos | xargs | tr -d '\r'`
do
  if [ -d "$repo" ]; then
    cd $repo
    if [ ${PARALLEL} == "true" ]; then
      # run in the background
      ${PULL_COMMAND} &
    else
      echo $repo
      ${PULL_COMMAND}
    fi
    cd ..
  fi
done

if [ ${PARALLEL} == "true" ]; then
  # wait for all background tasks to complete
  wait
fi