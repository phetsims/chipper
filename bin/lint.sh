#!/bin/sh
#====================================================================================================
#
# Runs jshint on sim code or all common code.
# You must run this from the root level of your simulation repo.
# Usage: ../chipper/bin/lint.sh [common]
#
# Author: Chris Malley (PixelZoom, Inc.)
#
#==============================================================================================

GRUNTFILE=../chipper/grunt/Gruntfile.js

if [ "$1" = "common" ]; then
   TARGET=lint-common
else
   TARGET=lint-sim
fi

grunt --gruntfile $GRUNTFILE --base `pwd` $TARGET