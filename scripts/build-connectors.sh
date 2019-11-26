#!/usr/bin/env bash
# this scripts builds a webpack project

# Ignore the client-side JS files and Test files
babel packages                          -d dist                                       --root-mode upward --verbose --copy-files --ignore "packages/connectors/*/src/**","packages/connectors/*/test/**","packages/hull-vm/src/**"

# Copy compiled local libs to the right place so Node lookups succeed
babel packages/hull                     -d dist/node_modules/hull                     --root-mode upward --verbose --copy-files
babel packages/hull-client              -d dist/node_modules/hull-client              --root-mode upward --verbose --copy-files
babel packages/hull-repl                -d dist/node_modules/hull-repl                --root-mode upward --verbose --copy-files
babel packages/hull-vm                  -d dist/node_modules/hull-vm                  --root-mode upward --verbose --copy-files --ignore "packages/hull-vm/src/**"
babel packages/hull-connector-framework -d dist/node_modules/hull-connector-framework --root-mode upward --verbose --copy-files

rsync -rl packages/ dist/ --ignore-existing

webpack --config webpack;
