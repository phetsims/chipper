#!/bin/bash
#=============================================================================================
#
# Clones all missing repos.
# Missing repos are identified by comparing your working directory to the active-repos file.
#
# Author: Aaron Davis
#
#=============================================================================================

CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}

if [ -d ./chipper ];
then
  MISSING_REPOS=`./chipper/bin/print-missing-repos.sh`
  for repo in `echo "${MISSING_REPOS}" | xargs`
  do
    git clone https://github.com/phetsims/"$repo".git
  done
else
  echo "I don't see chipper. Are you running this script in your working directory?"
fi
