#!/bin/sh
#====================================================================================================
#
# Shows git status for all repos
# This must be run from the main "git" directory (the parent of all simulation/chipper repo directories)
# Usage: chipper/bin/status.sh
#
# Author: Jonathan Olson
#
#====================================================================================================

for dir in *
do
  if [ -d "${dir}" ]; then
    cd $dir
    echo "${dir}"
    git status
    cd ..
  fi
done
