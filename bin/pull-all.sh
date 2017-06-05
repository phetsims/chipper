#!/bin/bash
#====================================================================================================
#
# Does a 'git-pull-all' on every active repo.
# Assumes that you have installed git-pull-all via: npm install -g git-pull-all
#
# Author: Jonathan Olson
# Author: Chris Malley (PixelZoom, Inc.)
#
#====================================================================================================

CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}

GIT_PULL_ALL=git-pull-all

if ! type ${GIT_PULL_ALL} > /dev/null 2>&1;
then
  echo "${GIT_PULL_ALL} not found. Install it by running: npm install -g ${GIT_PULL_ALL}"
else
  ${GIT_PULL_ALL}
fi

