#!/bin/sh

# This is a utility script to remove a npm package(s) from all
# child package.json in this mono repo

PACKAGES="$@"
echo $PACKAGES

remove_packages () {
  echo $PACKAGES
  for PACKAGE in $PACKAGES
  do
    echo ">>> removing $PACKAGE"
    yarn remove $PACKAGE
  done
}

echo ">>> removing from hull-node"
( cd ./packages/hull && remove_packages )
echo ">>> removing from hull-client-node"
( cd ./packages/hull-client && remove_packages )

for connector in ./packages/connectors/*/ ; do
  echo ">>> removing from  $connector"
  ( cd "$connector" && remove_packages )
done
