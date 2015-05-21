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

# ANSI escape sequences
RED="\033[31m"
RESET="\033[0m"

# Use GitHub markdown for table output
echo "Repo: 1st line of LICENSE"
echo "--------------------------"

for repo in `cat chipper/data/active-repos | xargs`
do
  if [ -d "$repo" ]; then
    cd $repo &> /dev/null

    # If the license file exists, print its 1st line
    if [ -e "LICENSE" ]; then
        echo "$repo: " `cat LICENSE | head -1`
    else
        echo -e "${RED}$repo: missing license${RESET}"
    fi
    cd .. &> /dev/null
  else
    echo -e "${RED}$repo: missing repository{RESET}"
  fi
done
