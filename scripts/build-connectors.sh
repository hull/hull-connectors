#!/usr/bin/env bash
# this scripts builds a webpack project
babel packages -d dist --root-mode upward --verbose --copy-files --ignore "packages/connectors/*/src/**","packages/connectors/*/test/**","packages/hull-vm/src/**" && rsync -rl packages/ dist/ --ignore-existing
babel packages/hull -d dist/node_modules/hull --root-mode upward --verbose --copy-files
babel packages/hull-client -d dist/node_modules/hull-client --root-mode upward --verbose --copy-files
webpack --config webpack;
