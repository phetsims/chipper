#!/bin/sh
#====================================================================================================
#
# Does a 'git pull --rebase' on every active repo. Should be called from the git root directory
# (the parent of all of the repo directories)
#
# Author: Jonathan Olson
#
#====================================================================================================

for repo in `cat chipper/data/active-repos | xargs`
do
  if [ -d "$repo" ]; then
    echo $repo
    cd $repo
    git pull --rebase
    cd ..
  fi
done
