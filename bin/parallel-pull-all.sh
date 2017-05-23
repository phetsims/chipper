#!/bin/bash
#====================================================================================================
#
# Does a 'git pull --rebase' on every active repo.  Done in parallel.  See pull-all.sh for the series one.
# See https://github.com/phetsims/chipper/issues/576 for more information
#
# Author: Jonathan Olson
# Author: Sam Reid
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

    # Run the pull in the background
    git pull --rebase &
    cd ..
  fi
done

# Wait for all background tasks to complete.
wait