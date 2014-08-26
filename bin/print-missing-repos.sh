#!/bin/bash
#
# Prints a list of repos that are missing from your working copy.
#
if [ -d ./chipper ];
then
   comm -23 <(sort -u ./chipper/bin/data/active-repos) <(/bin/ls -1 .)
else
   echo "I don't see chipper. Are you running this script in your working directory?"
fi
