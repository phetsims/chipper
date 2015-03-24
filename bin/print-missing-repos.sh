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
cd ${WORKING_DIR} ; comm -23 <(sort -u ./chipper/data/active-repos) <(/bin/ls -1 .)

