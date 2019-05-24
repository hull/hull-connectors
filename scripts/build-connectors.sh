#!/usr/bin/env bash
# this scripts builds a webpack project
babel packages -d dist --delete-dir-on-start --verbose --copy-files --ignore "packages/connectors/*/src/**","packages/connectors/*/test/**","packages/hull-vm/src/**" && rsync -rl packages/ dist/ --ignore-existing
webpack --config webpack;
