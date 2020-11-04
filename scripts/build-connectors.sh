#!/usr/bin/env bash
# this scripts builds a webpack project

# Ignore the client-side JS files and Test files
babel packages                          -d dist                                       --root-mode upward --verbose --copy-files --ignore "packages/connectors/*/src/**","packages/connectors/*/test/**","packages/hull-vm/src/**","packages/hull-webhooks/src/**","packages/hull-lightweight/src/**"

# Copy compiled local libs to the right place so Node lookups succeed
babel packages/hull                     -d dist/node_modules/hull                     --root-mode upward --verbose --copy-files
babel packages/hull-client              -d dist/node_modules/hull-client              --root-mode upward --verbose --copy-files
babel packages/hullrepl                 -d dist/node_modules/hullrepl                 --root-mode upward --verbose --copy-files
babel packages/hull-vm                  -d dist/node_modules/hull-vm                  --root-mode upward --verbose --copy-files --ignore "packages/hull-vm/src/**"
babel packages/hull-webhooks            -d dist/node_modules/hull-webhooks            --root-mode upward --verbose --copy-files --ignore "packages/hull-webhooks/src/**"
babel packages/hull-lightweight         -d dist/node_modules/hull-lightweight         --root-mode upward --verbose --copy-files --ignore "packages/hull-lightweight/src/**"
babel packages/hull-connector-framework -d dist/node_modules/hull-connector-framework --root-mode upward --verbose --copy-files

rsync -rl packages/ dist/ --ignore-existing

if [ -z ${CONNECTOR:sentinel} ]; then
  echo "Building all connectors"
  for d in packages/connectors/*; do
    if [ -d "$d" ]; then
      if [ -d "$d/src" ]; then
        webpack --progress --config webpack --env=$d
      fi
    fi
  done
else
  echo "Starting build on CONNECTOR='$CONNECTOR'"
  webpack --progress --config webpack --env="packages/connectors/$CONNECTOR"
fi
