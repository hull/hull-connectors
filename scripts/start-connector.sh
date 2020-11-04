#!/usr/bin/env bash
set -eu

CONNECTOR=${CONNECTOR:=$1}

: "${WEB_CONCURRENCY:=1}"
: "${NODE_ARGS:=""}"
: "${CONNECTOR:?CONNECTOR environment variable not set or empty. Should be set to the name of a valid connector such in the form \`hull-*\`}"

CONNECTORS=`ls -1 dist/connectors`

if [[ ! -d "dist/connectors/$CONNECTOR" ]]; then
  echo "$CONNECTOR is not a valid connector name - can't find dist/connectors/$CONNECTOR"
  exit 1
fi

PATH_TO_CONNECTOR="dist/connectors/$CONNECTOR"

if [ ! -d $PATH_TO_CONNECTOR ]; then
  echo "$PATH_TO_CONNECTOR does not exists"
  exit 1
fi

if [ -n "${MARATHON_APP_RESOURCE_MEM:-}" ]; then
  export MEMORY_AVAILABLE=`echo $MARATHON_APP_RESOURCE_MEM | awk '{print int(0.75 * int($1+0.5))}'`
else
  export MEMORY_AVAILABLE="1024"
fi

if [ -n "${MARATHON_APP_ID:-}" ]; then
  SHIP_CACHE_KEY_PREFIX=$MARATHON_APP_ID
  ./scripts/load-ssm-settings > .env
  source .env
fi

echo "Starting connector $PATH_TO_CONNECTOR with ${WEB_CONCURRENCY} instances on PORT $PORT"
PATH_TO_CONNECTOR=$PATH_TO_CONNECTOR pm2 -f -i $WEB_CONCURRENCY start dist/start.js --no-daemon -- $NODE_ARGS