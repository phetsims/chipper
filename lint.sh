#!/bin/sh

GRUNTFILE=../chipper/Gruntfile.js

if [ "$1" = "common" ]; then
   TARGET=lint-common
else
   TARGET=lint
fi

grunt --gruntfile $GRUNTFILE --base `pwd` $TARGET