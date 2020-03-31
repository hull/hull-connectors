#!/usr/bin/env bash

CONNECTOR=${CONNECTOR:=$1}

: "${CONNECTOR:?CONNECTOR environment variable not set or empty. Should be set to the name of a valid connector such in the form \`hull-*\`}"

CONNECTORS=`ls -1 dist/connectors`

if [[ ! -d "dist/connectors/$CONNECTOR" ]]; then
  echo "$CONNECTOR is not a valid connector name - can't find dist/connectors/$CONNECTOR"
  exit 1
fi

PATH_TO_CONNECTOR="dist/connectors/$CONNECTOR/server"

if [ ! -d $PATH_TO_CONNECTOR ]; then
  echo "$PATH_TO_CONNECTOR does not exists"
  exit 1
fi

echo "Starting $PATH_TO_CONNECTOR on PORT=$PORT";
export MEMORY_AVAILABLE=`echo $MARATHON_APP_RESOURCE_MEM | awk '{print int(0.75 * int($1+0.5))}'`

script/load-ssm-settings > .env
source .env

exec node --optimize_for_size --max_old_space_size=$MEMORY_AVAILABLE -r newrelic $PATH_TO_CONNECTOR
