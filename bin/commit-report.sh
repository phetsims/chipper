#!/bin/bash
# Output a formatted view of recent commits to help in writing a report
# Usage: commit-report.sh username
if [ -z "$1" ]
  then
    echo "Usage: commit-report.sh username"
    exit 1
fi
for-each.sh active-repos git log --since=7.days --author=$1 --pretty=format:"%C(yellow)%h %Cblue%>(12)%ad %Cgreen%<(7)%aN%Cred%d %Creset%s" --date=relative