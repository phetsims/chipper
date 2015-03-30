#!/bin/bash
#====================================================================================================
#
# Shows git status for all repos
# This must be run from the main "git" directory (the parent of all simulation/chipper repo directories)
# Usage: chipper/bin/status.sh
#
# GREEN: on master, no working copy changes
# RED: anything else
#
# Author: Jonathan Olson
#
#====================================================================================================

# ANSI escape sequences to move to the right (in the same line) or to apply or reset colors
MOVE_RIGHT="\033[36G"
RED="\033[31m"
GREEN="\033[32m"
RESET="\033[0m"

# must be run from root of working copy
if [ ! -d ./chipper ]; then
  echo "./chipper not found"
  exit 1
fi

for dir in *
do
  # ignore non-directory files
  if [ -d "${dir}" ]; then
    cd "${dir}" > /dev/null
    # ignore directory if it's not a git repo base
    if [ -d ".git" ]; then
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
        # color branch name based on branch and status. GREEN for clean master, RED for anything else
        if [ "$BRANCH" = "master" ]; then
          if [ -z "$STATUS" ]; then
            echo -e "${MOVE_RIGHT}${GREEN}master${RESET}"
          else
            echo -e "${MOVE_RIGHT}${RED}master${RESET}"
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
    cd .. > /dev/null
  fi
done
