#!/bin/bash
#====================================================================================================
#
# Shows git status for all repos
# This must be run from the main "git" directory (the parent of all simulation/chipper repo directories)
# Usage: chipper/bin/status.sh
#
# Author: Jonathan Olson
#
#====================================================================================================

# ANSI escape sequences to move to the right (in the same line) or to apply or reset colors
MOVE_RIGHT="\E[36G"
RED="\E[31m"
GREEN="\E[32m"
YELLOW="\E[33m"
RESET="\E[0m"

for dir in *
do
  # ignore non-directory files
  if [ -d "${dir}" ]; then
    cd $dir
    # ignore directory if it's not a git repo base
    if [ -d .git ]; then
      echo -n "${dir}" # -n for no newline

      # current branch name OR an empty string (if detached head)
      BRANCH=`git symbolic-ref -q HEAD | sed -e 's/refs\/heads\///'`

      # current SHA
      SHA=`git rev-parse HEAD`

      # status (empty string if clean)
      STATUS=`git status --porcelain`

      # if no branch, print our SHA (detached head)
      if [ -z "$BRANCH" ]; then
        echo -e "${MOVE_RIGHT}${RED}${SHA}${RESET}"
      else
        # color branch name based on branch and status. RED for non-master, otherwise GREEN/YELLOW depending on status
        if [ "$BRANCH" = "master" ]; then
          if [ -z "$STATUS" ]; then
            echo -e "${MOVE_RIGHT}${GREEN}master${RESET}"
          else
            echo -e "${MOVE_RIGHT}${YELLOW}master${RESET}"
          fi
        else
          echo -e "${MOVE_RIGHT}${RED}${BRANCH}${RESET}"
        fi
      fi

      # print status, if any
      if [ ! -z "$STATUS" ]; then
        echo "$STATUS"
      fi
    fi
    cd ..
  fi
done
