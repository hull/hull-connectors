#!/usr/bin/env bash

CONNECTOR=$1

: "${CONNECTOR:?CONNECTOR variable not set or empty. Should be set to \`hull-\*\`}"

CONNECTORS=($(ls -1 dist/connectors))

if [[ ! " ${CONNECTORS[@]} " =~ " ${CONNECTOR} " ]]; then
  echo "$CONNECTOR is not a valid connector name"
  exit 1
fi

PATH_TO_CONNECTOR="dist/connectors/$CONNECTOR/server"

if [ ! -d $PATH_TO_CONNECTOR ]; then
  echo "$PATH_TO_CONNECTOR does not exists"
  exit 1
fi

echo "starting $PATH_TO_CONNECTOR";

exec node --optimize_for_size --max_old_space_size=$MEMORY_AVAILABLE -r newrelic $PATH_TO_CONNECTOR
