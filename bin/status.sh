#!/bin/bash
#====================================================================================================
#
# Shows git status for all repos
#
# GREEN: on master, no working copy changes
# RED: anything else
#
# Author: Jonathan Olson
#
#====================================================================================================

CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}

# ANSI escape sequences to move to the right (in the same line) or to apply or reset colors
MOVE_RIGHT="\033[36G"
RED="\033[31m"
GREEN="\033[32m"
RESET="\033[0m"

for dir in *
do
  # ignore non-directory files
  if [ -d "${dir}" ]; then
    cd "${dir}" > /dev/null
    # ignore directory if it's not a git repo base
    if [ -d ".git" ]; then
      echo -n "${dir}" # -n for no newline

      REF=`git symbolic-ref -q HEAD`

      # current branch name OR an empty string (if detached head)
      BRANCH=`echo "${REF}" | sed -e 's/refs\/heads\///'`

      # current SHA
      SHA=`git rev-parse HEAD`

      # status (empty string if clean)
      STATUS=`git status --porcelain`

      # if no branch, print our SHA (detached head)
      if [ -z "$BRANCH" ]; then
        echo -e -n "${MOVE_RIGHT}${RED}${SHA}${RESET}"
      else
        # Safe method to get ahead/behind counts, see http://stackoverflow.com/questions/2969214/git-programmatically-know-by-how-much-the-branch-is-ahead-behind-a-remote-branc
        # get the tracking-branch name
        TRACKING_BRANCH=`git for-each-ref --format='%(upstream:short)' ${REF}`
        # creates global variables $1 and $2 based on left vs. right tracking
        # inspired by @adam_spiers
        COUNTS=`git rev-list --left-right --count $TRACKING_BRANCH...HEAD` # e.g. behind-count + '\t' + ahead-count
        # split the behind and ahead count
        BEHIND=`echo "${COUNTS}" | awk '{ print $1 }'`
        AHEAD=`echo "${COUNTS}" | awk '{ print $2 }'`

        # color branch name based on branch and status. GREEN for clean master, RED for anything else
        if [ "$BRANCH" = "master" ]; then
          if [ -z "$STATUS" -a "$AHEAD" -eq 0 ]; then
            echo -e -n "${MOVE_RIGHT}${GREEN}master${RESET}"
          else
            echo -e -n "${MOVE_RIGHT}${RED}master${RESET}"
          fi
        else
          echo -e -n "${MOVE_RIGHT}${RED}${BRANCH}${RESET}"
        fi

        if [ ! "$AHEAD" -eq 0 ]; then
          echo -e -n " ahead ${AHEAD}"
        fi

        if [ ! "$BEHIND" -eq 0 ]; then
          echo -e -n " behind ${BEHIND}"
        fi
      fi

      echo ""

      # print status, if any
      if [ ! -z "$STATUS" ]; then
        echo "$STATUS"
      fi
    fi
    cd .. > /dev/null
  fi
done
