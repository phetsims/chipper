#!/bin/bash
#=======================================================================================
#
# Prints a list of repos that are missing from your working copy.
# Requires chipper repo to be checked out at the top-level of your working copy,
# and all other repos to be siblings of chipper.
#
# Author: Chris Malley (PixelZoom, Inc.)
#
#=======================================================================================

CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}

# This used to be the simple line, but Git bash on windows doesn't include comm
# comm -23 <(sort -u ./chipper/data/active-repos) <(/bin/ls -1 .)

# A list of repo names that is either in active-repos OR is checked out (but not both).
# uniq -u only includes non-duplicate lines
ITEMS_IN_ONE_LIST=`cat <(cat ./chipper/data/active-repos) <(ls -1 .) | sort | uniq -u`

# uniq -d only includes duplicate lines
cat <(cat ./chipper/data/active-repos) <(echo "$ITEMS_IN_ONE_LIST") | sort | uniq -d
