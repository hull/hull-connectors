#!/usr/bin/env bash
#yarn workspaces run version --new-version $1 --no-git-tag-version
#yarn version --new-version $1 --no-git-tag-version

sedi () {
  sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}

for file in packages/connectors/*/manifest.json; do
  sedi "s/\"version\":.*/\"version\": \"$1\",/" $file
done
