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

PACKAGE_JSON=./package.json
GRUNTFILE=../chipper/grunt/Gruntfile.js
OUTPUT_DIR=./build

# check for prerequisite files
for file in $GRUNTFILE $PACKAGE_JSON; do
  if [ ! -f $file ]; then
    echo "missing $file"; exit 1
  fi
done

# read build configuration from package.json
function parseJSON() {
  echo `grep $1 package.json | awk -F ':' '{print $2}' | tr ",\"" " "`
}
PROJECT=`parseJSON project`
VERSION=`parseJSON version`
RESOURCE_DIRS=`parseJSON resourceDirs`
COMMON_CSS=`parseJSON commonCSS`
COMMON_SCRIPTS=`parseJSON commonScripts`

# check prerequisite config variables
if [ -z "$PROJECT" ]; then
   echo "PROJECT is not set in $CONFIG_FILE"; exit 1
fi
if [ -z "$VERSION" ]; then
   echo "VERSION is not set in $CONFIG_FILE"; exit 1
fi

# check prerequisite project files
HTML_FILE=${PROJECT}.html
for file in $HTML_FILE; do
  if [ ! -f $file ]; then
    echo "missing $file"; exit 1
  fi
done

echo "Building $PROJECT $VERSION ..."

echo "Cleaning ${OUTPUT_DIR} ..."
rm -rf $OUTPUT_DIR
mkdir $OUTPUT_DIR

echo "Creating minified script ..."
grunt --gruntfile $GRUNTFILE --base `pwd` || { echo 'grunt failed' ; exit 1; }

echo "Copying 3rd-party libs ..."
cp -rp lib $OUTPUT_DIR

echo "Copying resources ..."
if [ ! -z "$RESOURCE_DIRS" ]; then
  for dir in $RESOURCE_DIRS; do
    echo "copying $dir ..."
    cp -rp $dir $OUTPUT_DIR
  done
fi

echo "Consolidating CSS files ..."
if [ -d ./css ]; then
  cp -rp ./css $OUTPUT_DIR
else
  mkdir ${OUTPUT_DIR}/css
fi
if [ ! -z $COMMON_CSS ]; then
  for css in $COMMON_CSS; do
     echo "copying $css ..."
    cp -p $css ${OUTPUT_DIR}/css
  done
fi

echo "Copying scripts that are loaded before RequireJS ..."
if [ ! -z "$OUTPUT_DIR" ]; then
  mkdir $OUTPUT_DIR/js
  for script in $COMMON_SCRIPTS; do
    echo "copying $script ..."
    cp -p $script ${OUTPUT_DIR}/js
  done
fi

echo "Modifying HTML file..."

BACKUP_SUFFIX=.bup
cp $HTML_FILE $OUTPUT_DIR

# change script tag to load minified script
sed -i $BACKUP_SUFFIX "s/<script data-main=\"js\/${PROJECT}-config.js\" src=\".*\">/<script type=\"text\/javascript\" src=\"${PROJECT}.min.js\">/g" ${OUTPUT_DIR}/${HTML_FILE}

# change the path of any CSS files that were consolidated
for css in $COMMON_CSS; do
  fromFile=`echo $css | sed -e 's/[\/]/\\&\//g' | tr '\&' '\'`
  toFile=css\\/`basename $css`
  sed -i $BACKUP_SUFFIX "s/${fromFile}/${toFile}/g" ${OUTPUT_DIR}/${HTML_FILE}
done

# change the path of any scripts that were copied
for script in $COMMON_SCRIPTS; do
  fromFile=`echo $script | sed -e 's/[\/]/\\&\//g' | tr '\&' '\'`
  toFile=js\\/`basename $script`
  sed -i $BACKUP_SUFFIX "s/${fromFile}/${toFile}/g" ${OUTPUT_DIR}/${HTML_FILE}
done

# delete sed backup files
rm ${OUTPUT_DIR}/${HTML_FILE}${BACKUP_SUFFIX}

echo "Done."

#====================================================================================================