#!/bin/sh
#==================================================================================
#
# Checks out the specified branch of all repositories in the present working dir.
# Skips and prints a warning for any repository that doesn't have such a branch.
# Also skips directories that are not Git repositories.
#
# Usage: checkout-branch.sh branchName
#
# Author: Chris Malley (PixelZoom, Inc.)
#
#==================================================================================

# parse command line
if [ $# != 1 ]; then
  echo "usage: checkout-branch.sh branchName"
  exit 1
fi
BRANCH=$1

# visit all directories that are Git repositories
for dir in */; do
   if [ -d ${dir}/.git ]
   then
     cd $dir &> /dev/null
     git ls-remote --exit-code . origin/${BRANCH} &> /dev/null
     if [ $? != 0 ]; then
       echo "WARNING: $dir has no such branch"
     else
       git checkout $1 &> /dev/null
       echo $dir
     fi
     cd ..
   fi
done