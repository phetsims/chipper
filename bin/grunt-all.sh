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
INPUT_FILE=${WORKING_DIR}/chipper/data/active-runnables
USAGE="usage: `basename $0` [-f fileOfRepoNames] gruntTask"

# Exit immediately on Ctrl-C
trap "exit 1" SIGINT

# Read command line args
while getopts "f:" opt; do
  case $opt in
    f) INPUT_FILE=${OPTARG};;
    ?) echo ${USAGE}
       exit 1;;
  esac
done
shift $(( OPTIND-1 ))

echo "Processing repositories listed in $INPUT_FILE"
REPO_LIST=`cat ${INPUT_FILE} | xargs`

for sim in ${REPO_LIST}
do
  if [ -d "${WORKING_DIR}/$sim" ]; then
    echo "Building" ${sim}
    cd ${WORKING_DIR}/${sim} # build.sh needs to be run from the sim directory
    npm install             # executes quickly when everything is up to date compared to build.sh
    grunt $*                # run grunt with command-line args
  else
    echo ">>>>>>>>>>>>>>>> MISSING " $sim
  fi
done
