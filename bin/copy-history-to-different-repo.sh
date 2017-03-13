#!/bin/bash
#====================================================================================================
#
# Copies the history from one file/directory in one repo to another repo, using patches.
# Implementation based on the highest voted answer in http://stackoverflow.com/questions/1365541/how-to-move-files-from-one-git-repo-to-another-not-a-clone-preserving-history
#
# Usage:
# 1. cd into the directory of the source repository
# 2. copy-history-to-different-repo.sh FILE_OR_DIRECTORY DESTINATION_REPOSITORY
# 3. review the patch file to make sure nothing looks like trouble
# 4. move the file to the correct path in the destination repository
# 5. cd into the destination repository
# 6. git push
# 7. remove the patches/ directory
#
# Example:
# cd john-travoltage/
# copy-history-to-different-repo.sh js/SomeButtonFile.js ../sun
#
# Author: Sam Reid (PhET Interactive Simulations)
# Author: Michael Kauzmann (PhET Interactive Simulations)
#
#====================================================================================================

# parse arguments
if [ $# != 2 ]; then
  echo "usage: copy-history-to-different-repo.sh FILE_OR_DIRECTORY DESTINATION_REPOSITORY"
  exit 1
fi
FILE_OR_DIRECTORY=$1
DESTINATION_REPOSITORY=$2

# Get the name of the current working directory (without the full path)
RUN_DIR=${PWD##*/}

# Use a separate directory rather than cluttering up either repo
PATCHFILE="../patches/$RUN_DIR/${FILE_OR_DIRECTORY}_patch.txt"

echo "running: copy-history-to-different-repo.sh $FILE_OR_DIRECTORY ${DESTINATION_REPOSITORY} $PATCHFILE"

# Create the full path, including subdirectories for the patchfile, then delete the folder itself because we
# will place the file there.  Remove it if it was there in a previous run.
rm ${PATCHFILE}
mkdir -p ${PATCHFILE}
rm -r ${PATCHFILE}

git log --pretty=email --patch-with-stat --reverse --full-index --binary -- ${FILE_OR_DIRECTORY} > ${PATCHFILE}
cd ${DESTINATION_REPOSITORY}
git am < ${PATCHFILE}
echo "Finished, please review $PATCHFILE then push changes if you like them"