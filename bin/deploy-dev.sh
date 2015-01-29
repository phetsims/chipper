#!/bin/bash -i
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
PHET_DEV_SERVER=${PHET_DEV_SERVER:=spot.colorado.edu}
PHET_DEV_ROOT=/htdocs/physics/phet/dev/html
echo "Deploying $NAME $VERSION to $PHET_DEV_SERVER"
scp -r $BUILD_DIR ${USER_NAME}@${PHET_DEV_SERVER}:${PHET_DEV_ROOT}/${NAME}/${VERSION}

# check in dependencies.json
echo "Checking in dependencies.json ..."
cp ${BUILD_DIR}/dependencies.json .
git add dependencies.json
git commit --message "check in dependencies.json for ${VERSION}"
git push

# print the deployed URL, so you can test quickly via copy-paste
echo "deployed:" http://www.colorado.edu/physics/phet/dev/html/${NAME}/${VERSION}/${NAME}_en.html

#====================================================================================================