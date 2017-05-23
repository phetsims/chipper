#!/bin/bash
#=============================================================================================
#
# Bumps version number, builds and deploys
#
# Author: Sam Reid, PhET Interactive Simulations
#
#=============================================================================================

grunt bump-version
grunt
grunt deploy-dev