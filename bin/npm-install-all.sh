#!/bin/bash
#====================================================================================================
#
# Does a 'npm install --rebase' on every active repo.
#
# Author: Jonathan Olson (small mod by Ariel Paul)
#
#====================================================================================================

CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}

for repo in `cat chipper/data/active-repos | xargs | tr -d '\r'`
do
  if [ -d "$repo" ]; then
    echo $repo
    cd $repo
    npm install --rebase
    cd ..
  fi
done
