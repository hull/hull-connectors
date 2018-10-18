#!/usr/bin/env bash
yarn workspaces run version --new-version $1 --no-git-tag-version
yarn version --new-version $1 --no-git-tag-version
