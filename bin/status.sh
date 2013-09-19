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
    git status | grep -v nothing | sed -e 's/# On branch master/                                    \x1BM\x1B\[32mmaster\x1B\[0m/' \
                                       -e 's/# On branch \(.*\)$/                                    \x1BM\x1B\[31m\1\x1B\[0m/'
    cd ..
  fi
done
