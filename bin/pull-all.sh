#!/bin/bash
#====================================================================================================
#
# Does a 'git pull --rebase' on every active repo.
#
# Author: Jonathan Olson
#
#====================================================================================================

CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}

for repo in `cat chipper/data/active-repos | xargs`
do
  if [ -d "$repo" ]; then
    echo $repo
    cd $repo
    git pull --rebase
    cd ..
  fi
done
