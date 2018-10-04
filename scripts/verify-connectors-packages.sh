#!/bin/sh

output=$(find packages/connectors -mindepth 1 -maxdepth 1 -type d '!' -exec test -e "{}/package.json" ';' -print)

if [ ! -z $output ]
then
  echo "Found some connectors without package.json. Did you forget to add the new connector to the root Dockerfile?"
  echo "List of the connectors below"
  echo $output
  exit 1
fi
