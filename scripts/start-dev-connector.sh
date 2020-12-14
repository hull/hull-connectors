#!/usr/bin/env bash
# this scripts starts the connector in dev

CONNECTOR=${CONNECTOR:=$1}
PATH_TO_CONNECTOR="packages/connectors/$CONNECTOR"

if [ -f $PATH_TO_CONNECTOR/.env ]; then
  source $PATH_TO_CONNECTOR/.env
  cat $PATH_TO_CONNECTOR/.env
fi

echo "Starting $PATH_TO_CONNECTOR on PORT $PORT";
NODE_HEAPDUMP_OPTIONS=nosignal WEB_CONCURRENCY=1 PATH_TO_CONNECTOR=$PATH_TO_CONNECTOR nodemon --inspect -r ./root-babel-register packages/start.js
