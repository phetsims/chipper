#!/bin/sh
#====================================================================================================
#
# temporary shim for working-snapshot.json output, somewhat copied from build.sh
#
# Its purpose is for specific common-code repos (dot/kite/scenery). When they were broken by
# other common changes, it took a lot of time to track down (since I couldn't bisect across ~8 repos),
# so I found it easier to take snapshots of my repos when they were working, and when I came across
# a break, I could identify all of the common code commits that could have caused the break.
#
# NOTE: If/when this script is deleted, working-snapshot.json would then be deleted from all
# applicable repos.
#
# Author: Jonathan Olson
#
#====================================================================================================

# Check for prerequisite files
PACKAGE_JSON=./package.json

# read build configuration from package.json
function parseJSON() {
  echo `grep $1 ${PACKAGE_JSON} | awk -F ':' '{print $2}' | tr ",\"" " "`
}
PHET_LIBS=`parseJSON phetLibs`

# check prerequisite config variables
if [ -z "$PHET_LIBS" ]; then
   echo "phetLibs is not set in $PACKAGE_JSON"; exit 1
fi

echo "= Generating working-snapshot.json"
OUTFILE=working-snapshot.json
echo "{" > $OUTFILE
if [[ "$PHET_LIBS" == *chipper* ]]
then
  # lazy here
  PHET_LIBS="$PHET_LIBS"
else
  PHET_LIBS="$PHET_LIBS chipper"
fi
for dependency in $PHET_LIBS; do
  SHA=`( cd ../$dependency; git rev-parse HEAD )`
  BRANCH=`( cd ../$dependency; git rev-parse --abbrev-ref HEAD )`
  echo "  \"${dependency}\": {" >> $OUTFILE
  echo "    \"sha\": \"${SHA}\"," >> $OUTFILE
  echo "    \"branch\": \"${BRANCH}\"" >> $OUTFILE
  echo "  }," >> $OUTFILE # TODO: fix the trailing comma, not allowed in JSON!
done
echo "}" >> $OUTFILE

echo "= Done."

#====================================================================================================
