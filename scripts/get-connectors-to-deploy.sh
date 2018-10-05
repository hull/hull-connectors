#!/bin/sh

# This is a script which reads `deployment.config.js` file
# to get all connectors which should be deployed on specific branch

: "${BRANCH:?BRANCH variable not set or empty}"

node -p "Object.entries(require(\"./deployment.config.js\").connectors)\
  .filter(c => Object.keys(c[1])\
  .indexOf(\"${BRANCH}\") !== -1)\
  .map(c => c[0])\
  .join(\"\n\")"
