#!/bin/bash
#=======================================================================================
#
# Prints a list of repos in your working copy that are not in active-repos.
# Requires chipper repo to be checked out at the top-level of your working copy,
# and all other repos to be siblings of chipper.
#
# Author: Chris Malley (PixelZoom, Inc.)
#
#=======================================================================================

CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}

ACTIVE_REPOS=`cat ./chipper/data/active-repos | tr -d '\015'`

for filename in `ls -1 .`
do
  found="false"
  for repository in $ACTIVE_REPOS
  do
    if [ "$filename" == "$repository" ]; then
      found="true"
      break
    fi
  done
  if [ "$found" == "false" ]; then
    echo "$filename is not in active-repos"
  fi
done