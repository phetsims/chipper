#!/bin/sh
#====================================================================================================
#
# Builds a simulation for deployment.
# You must run this from the root level of your simulation repo.
# Usage: ../chipper/bin/build.sh
#
# Author: Chris Malley (PixelZoom, Inc.)
#
#====================================================================================================

OUTPUT_DIR=./build

# Check for prerequisite files
PACKAGE_JSON=./package.json
GRUNTFILE=../chipper/grunt/Gruntfile.js
MERGEJS=../mergejs/mergejs
for file in $GRUNTFILE $PACKAGE_JSON $MERGEJS; do
  if [ ! -f $file ]; then
    echo "missing $file"; exit 1
  fi
done

# read build configuration from package.json
function parseJSON() {
  echo `grep $1 ${PACKAGE_JSON} | awk -F ':' '{print $2}' | tr ",\"" " "`
}
NAME=`parseJSON name`
VERSION=`parseJSON version`
RESOURCE_DIRS=`parseJSON resourceDirs`
PHET_LIBS=`parseJSON phetLibs`
PRELOAD=`parseJSON preload`

# check prerequisite config variables
if [ -z "$NAME" ]; then
   echo "name is not set in $PACKAGE_JSON"; exit 1
fi
if [ -z "$VERSION" ]; then
   echo "version is not set in $PACKAGE_JSON"; exit 1
fi
if [ -z "$PHET_LIBS" ]; then
   echo "phetLibs is not set in $PACKAGE_JSON"; exit 1
fi
if [ -z "$PRELOAD" ]; then
   echo "preload is not set in $PACKAGE_JSON"; exit 1
fi

echo "= Building $NAME $VERSION"

echo "= Cleaning ${OUTPUT_DIR}"
rm -rf $OUTPUT_DIR
mkdir $OUTPUT_DIR

echo "= Minifying scripts that are preloaded"
MERGEJS_INPUT_FILE=mergejs-input.txt
MERGEJS_OUTPUT_FILE=${NAME}-preload.min.js
for file in $PRELOAD; do
  if [ ! -f $file ]; then
    echo "$file does not exist, appears in $PACKAGE_JSON"; exit 1
  fi
done
echo $PRELOAD > $MERGEJS_INPUT_FILE
$MERGEJS -c $MERGEJS_INPUT_FILE mergejs-out.js
mv mergejs-out-min.js ${OUTPUT_DIR}/${MERGEJS_OUTPUT_FILE}
rm $MERGEJS_INPUT_FILE mergejs-out.js

echo "= Minifying scripts that are loaded by requirejs"
grunt --gruntfile $GRUNTFILE --base `pwd` || { echo 'grunt failed' ; exit 1; }

echo "= Copying changes.txt"
if [ -f changes.txt ]; then
  cp changes.txt $OUTPUT_DIR
fi

echo "= Copying resource directories:"
if [ ! -z "$RESOURCE_DIRS" ]; then
  for dir in $RESOURCE_DIRS; do
    echo "$dir"
    cp -rp $dir $OUTPUT_DIR
  done
fi

echo "= Generating shas.txt"
SHAS_FILE=${OUTPUT_DIR}/shas.txt
echo "# $NAME $VERSION" `date` > $SHAS_FILE
for dependency in $PHET_LIBS; do
 echo $dependency `( cd ../$dependency; git rev-parse HEAD )` >> $SHAS_FILE
done

echo "= Creating HTML file"
HTML_FILE=${OUTPUT_DIR}/${NAME}.html
BACKUP_SUFFIX=.bup
cp ../chipper/templates/sim.html ${HTML_FILE}

# fill in script tags
sed -i$BACKUP_SUFFIX "s/MERGEJS_OUTPUT_FILE/${MERGEJS_OUTPUT_FILE}/g" ${HTML_FILE}
sed -i$BACKUP_SUFFIX "s/GRUNT_OUTPUT_FILE/${NAME}.min.js/g" ${HTML_FILE}

# Add the splash screen as base64
SPLASH_TEMPLATE=../chipper/templates/splash.html
sed -i$BACKUP_SUFFIX "s/<body>/`cat $SPLASH_TEMPLATE`/g" ${HTML_FILE}

# delete sed backup files
rm ${HTML_FILE}${BACKUP_SUFFIX}

echo "= Done."

#====================================================================================================