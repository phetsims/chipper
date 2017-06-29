#!/bin/bash
# Output a formatted view of recent commits to help in writing a report
# Usage: commit-report.sh username
if [ -z "$1" ]
  then
    echo "Usage: commit-report.sh username"
    exit 1
fi
for-each.sh active-repos git log --all --remotes --since=7.days --author=$1 --pretty=format:"%an %ad %s" --date=relative; printf "\n"