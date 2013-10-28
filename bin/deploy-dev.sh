#!/bin/sh -i
#====================================================================================================
#
# Deploys a dev build to spot.colorado.edu
# You must run this from the root level of your simulation repo.
# Usage: ../chipper/bin/deploy-dev.sh username
#
# Author: Chris Malley (PixelZoom, Inc.)
#
#====================================================================================================

PACKAGE_JSON=./package.json
BUILD_DIR=build

# parse command line
if [ $# != 1 ]; then
   echo "Usage: deploy-dev username" ; exit 1
fi
USER_NAME=${1}

# check prerequisite files
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
NAME=`parseJSON \"name\":`
VERSION=`parseJSON \"version\":`

# copy to server
SERVER=spot.colorado.edu
DEV_ROOT=/htdocs/physics/phet/dev/html
echo "Deploying $NAME $VERSION to $SERVER"
scp -r $BUILD_DIR ${USER_NAME}@${SERVER}:${DEV_ROOT}/${NAME}/${VERSION}

# print the deployed URL, so you can test quickly via copy-paste
echo "deployed:" http://www.colorado.edu/physics/phet/dev/html/${NAME}/${VERSION}/${NAME}_en.html

#====================================================================================================