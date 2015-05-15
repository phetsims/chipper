#!/bin/bash
#====================================================================================================
#
# For each file in active-repos, it prints the repo name and the 1st line of the LICENSE file
# in a GitHub markdown table format
#
# Author: Sam Reid
#
#====================================================================================================

CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}

# Use GitHub markdown for table output
echo "Repo  | 1st line of LICENSE"
echo "------------- | -------------"

for repo in `cat chipper/data/active-repos | xargs`
do
  if [ -d "$repo" ]; then
    cd $repo                 
    value=`cat LICENSE | head -1`
    
    # If the license file exists, print its 1st line
    if [ -e "LICENSE" ]; then
        echo $repo " | " $value
    else
        echo $repo " | undefined"
             fi
    cd ..   
  else
    echo ">>>>>>>>>>>>>>>> MISSING " $repo
  fi
done
