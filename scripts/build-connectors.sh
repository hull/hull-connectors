#!/usr/bin/env bash
# this scripts builds a webpack project
CONNECTOR=${CONNECTOR:=$1}
echo "CONNECTOR BUILD SPECIFIED: $CONNECTOR"

# Ignore the client-side JS files and Test files
babel packages                          -d dist                                       --root-mode upward --verbose --copy-files --ignore "packages/connectors/*/src/**","packages/connectors/*/test/**","packages/hull-vm/src/**","packages/hull-webhooks/src/**","packages/hull-lightweight/src/**","packages/hull-sql/src/**"

# Copy compiled local libs to the right place so Node lookups succeed
babel packages/hull                     -d dist/node_modules/hull                     --root-mode upward --verbose --copy-files
babel packages/hull-client              -d dist/node_modules/hull-client              --root-mode upward --verbose --copy-files
babel packages/hullrepl                 -d dist/node_modules/hullrepl                 --root-mode upward --verbose --copy-files
babel packages/hull-vm                  -d dist/node_modules/hull-vm                  --root-mode upward --verbose --copy-files --ignore "packages/hull-vm/src/**"
babel packages/hull-webhooks            -d dist/node_modules/hull-webhooks            --root-mode upward --verbose --copy-files --ignore "packages/hull-webhooks/src/**"
babel packages/hull-lightweight         -d dist/node_modules/hull-lightweight         --root-mode upward --verbose --copy-files --ignore "packages/hull-lightweight/src/**"
babel packages/hull-sql                 -d dist/node_modules/hull-sql                 --root-mode upward --verbose --copy-files --ignore "packages/hull-sql/src/**"
babel packages/hull-connector-framework -d dist/node_modules/hull-connector-framework --root-mode upward --verbose --copy-files

rsync -rl packages/ dist/ --ignore-existing

if [[ $CONNECTOR && -d "packages/connectors/$CONNECTOR" && -d "packages/connectors/$CONNECTOR/src" ]]; then
  echo "Building only one Connector"
  webpack --progress --config webpack --env="packages/connectors/$CONNECTOR"
else
  echo "Building all Connectors"
  for d in packages/connectors/*; do
    if [ -d "$d" ]; then
      if [ -d "$d/src" ]; then
        webpack --progress --config webpack --env=$d
      fi
    fi
  done
fi

