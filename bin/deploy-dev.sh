#!/bin/sh -i
#====================================================================================================
#
# Deploys a dev build to spot.colorado.edu
#
# Author: Chris Malley (PixelZoom, Inc.)
#
#====================================================================================================

PACKAGE_JSON=./package.json
BUILD_DIR=build

if [ $# != 1 ]; then
   echo "Usage: deploy-dev username" ; exit 1
fi
if [ ! -f $PACKAGE_JSON ]; then
   echo "Cannot find $PACKAGE_JSON" ; exit 1
fi
if [ ! -d $BUILD_DIR ]; then
   echo "Cannot find $BUILD_DIR" ; exit 1
fi

# read build configuration from package.json
function parseJSON() {
  echo `grep $1 ${PACKAGE_JSON} | awk -F ':' '{print $2}' | tr ",\"" " "`
}
NAME=`parseJSON name`
VERSION=`parseJSON version`


USER_NAME=${1}
SERVER=spot.colorado.edu
DEV_ROOT=/htdocs/physics/phet/dev/html

echo "Deploying $NAME $VERSION to $SERVER"
scp -r $BUILD_DIR ${USERNAME}@${SERVER}:${DEV_ROOT}/${NAME}/${VERSION}

#====================================================================================================