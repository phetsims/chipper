#!/bin/bash
#====================================================================================================
#
# Does a 'git pull --rebase' on chipper
#
# Author: Sam Reid (PhET Interactive Simulations)
#
#====================================================================================================

CHIPPER_BIN=`dirname "${BASH_SOURCE[0]}"`
WORKING_DIR=${CHIPPER_BIN}/../..
cd ${WORKING_DIR}
cd chipper
git pull --rebase
cd ..