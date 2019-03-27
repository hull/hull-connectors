#!/usr/bin/env bash
# this scripts builds a webpack project
babel packages -d dist --delete-dir-on-start --verbose --copy-files;
webpack --config webpack;
