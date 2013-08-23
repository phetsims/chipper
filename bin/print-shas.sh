#/bin/bash
#=======================================================================================
#
# Prints shas for all repos that are immediate children of the current directory.
#
# Author: Chris Malley (PixelZoom, Inc.)
#
#=======================================================================================

for repo in `ls -1`
do
    # if it's a Git repository...
    if [ -d $repo/.git ]
    then
        cd $repo > /dev/null
        echo -n $repo ": "
        git rev-parse HEAD
        cd ..
    fi
done