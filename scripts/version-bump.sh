#!/usr/bin/env bash
SEMVER_REGEX='^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z0-9-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z0-9-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$'

echo "$1" | grep -qE $SEMVER_REGEX
if (( $? == 1 )) ; then
  echo "Provided version does not match Hull platform semver regex.";
  echo "Refer manifest.json schema file below:"
  echo "https://github.com/hull/hull/blob/master/config/schemas/app/manifest.yml#L125"
  echo "Stopping the script now."
  exit;
fi

yarn workspaces run version --new-version $1 --no-git-tag-version
yarn version --new-version $1 --no-git-tag-version

sedi () {
  sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}

for file in packages/connectors/*/manifest.json; do
  sedi "s/\"version\":.*/\"version\": \"$1\",/" $file
done
