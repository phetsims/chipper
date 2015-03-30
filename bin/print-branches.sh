#!/bin/sh
#====================================================================================================
#
# For each active repository, prints the names of all remote branches.
#
# Author: Chris Malley
#
#====================================================================================================

# must be run from root of working copy
if [ ! -d ./chipper ]; then
  echo "./chipper not found"
  exit 1
fi

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