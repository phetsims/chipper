#!/bin/bash
#=======================================================================================
#
# Prints a list of repos that are missing from your working copy.
# Requires chipper repo to be checked out at the top-level of your working copy,
# and all other repos to be siblings of chipper.
#
# Author: Chris Malley (PixelZoom, Inc.), Jonathan Olson <jonathan.olson@colorado.edu>
#
#=======================================================================================

CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}

# This used to be the simple line, but Git bash on windows doesn't include comm, or the way of piping in results.
# comm -23 <(sort -u ./chipper/data/active-repos) <(/bin/ls -1 .)

# Lists of repo names and possible repo names (directories)
ACTIVE_REPOS=`cat ./chipper/data/active-repos | tr -d '\015'`
DIRECTORIES=`ls -1 .`

# A list of repo names that is either in active-repos OR is checked out (but not both).
# uniq -u only includes non-duplicate lines
ITEMS_IN_ONE_LIST=`echo -e "${ACTIVE_REPOS}\n${DIRECTORIES}" | sort | uniq -u`

# uniq -d only includes duplicate lines
echo -e "${ACTIVE_REPOS}\n${ITEMS_IN_ONE_LIST}" | sort | uniq -d
