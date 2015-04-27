#!/bin/sh
#====================================================================================================
#
# For each active repository, prints the names of all remote branches.
#
# Author: Chris Malley
#
#====================================================================================================

CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}

for sim in `cat chipper/data/active-repos | sort | xargs`
do
  if [ -d "$sim" ]; then
    echo $sim
    cd $sim > /dev/null
    git branch -r
    cd ..
  else
    echo ">>>>>>>>>>>>>>>>>>>>>>>> Missing repo: $sim"
  fi
done