#!/bin/sh
# temporary shim for working-snapshot.json output, somewhat copied from build.sh

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
echo "{" >> $OUTFILE
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
