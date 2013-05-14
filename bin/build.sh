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

# check for prerequisite build files
for file in $GRUNTFILE $PACKAGE_JSON; do
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
DEPENDENCIES=`parseJSON dependencies`
INCLUDE=`parseJSON include`

# check prerequisite config variables
if [ -z "$NAME" ]; then
   echo "NAME is not set in $CONFIG_FILE"; exit 1
fi
if [ -z "$VERSION" ]; then
   echo "VERSION is not set in $CONFIG_FILE"; exit 1
fi
if [ -z "$DEPENDENCIES" ]; then
   echo "DEPENDENCIES is not set in $CONFIG_FILE"; exit 1
fi

# check prerequisite project files
HTML_FILE=${NAME}.html
for file in $HTML_FILE; do
  if [ ! -f $file ]; then
    echo "missing $file"; exit 1
  fi
done

echo "= Building $NAME $VERSION"

echo "= Cleaning ${OUTPUT_DIR}"
rm -rf $OUTPUT_DIR
mkdir $OUTPUT_DIR

echo "= Creating minified script"
grunt --gruntfile $GRUNTFILE --base `pwd` || { echo 'grunt failed' ; exit 1; }

echo "= Copying 3rd-party libs"
cp -rp lib $OUTPUT_DIR

echo "= Copying CSS files"
if [ -d ./css ]; then
  cp -rp ./css $OUTPUT_DIR
fi

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

echo "= Copying include files:"
if [ ! -z "$INCLUDE" ]; then
  mkdir ${OUTPUT_DIR}/include
  for file in $INCLUDE; do
    echo "$file"
    cp ${file} ${OUTPUT_DIR}/include
  done
fi

echo "= Generating shas.txt"
SHAS_FILE=${OUTPUT_DIR}/shas.txt
echo "# $NAME $VERSION" `date` > $SHAS_FILE
for dependency in $DEPENDENCIES; do
 echo $dependency `( cd ../$dependency; git rev-parse HEAD )` >> $SHAS_FILE
done
exit 1

echo "= Modifying HTML file"
BACKUP_SUFFIX=.bup
cp $HTML_FILE $OUTPUT_DIR

# change script tag to load minified script
sed -i$BACKUP_SUFFIX "s/<script data-main=\"js\/${NAME}-config.js\" src=\".*\">/<script type=\"text\/javascript\" src=\"${NAME}.min.js\">/g" ${OUTPUT_DIR}/${HTML_FILE}

# change the path of any include files
for file in $INCLUDE; do
  fromFile=`echo $file | sed -e 's/[\/]/\\&\//g' | tr '\&' '\'`
  toFile=include\\/`basename $file`
  sed -i$BACKUP_SUFFIX "s/${fromFile}/${toFile}/g" ${OUTPUT_DIR}/${HTML_FILE}
done

# delete sed backup files
rm ${OUTPUT_DIR}/${HTML_FILE}${BACKUP_SUFFIX}

echo "= Done."

#====================================================================================================