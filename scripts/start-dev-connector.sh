#!/usr/bin/env bash
# this scripts starts the connector in dev

CONNECTOR=${CONNECTOR:=$1}
PATH_TO_CONNECTOR="packages/connectors/$1"

if [ -f $PATH_TO_CONNECTOR/.env ]; then
  source $PATH_TO_CONNECTOR/.env
  cat $PATH_TO_CONNECTOR/.env
fi

# We use a cluster mode here to be closest to production setup. We don't want the max number for perf reasons though
# We use pm2-start.js because you need to require Babel manually in cluster mode. `interpreter=babel-node` doesn't work.
exec pm2 --watch="packages" -i 2 --ignore-watch="node_modules" start ./pm2-start.js -- --connector=$PATH_TO_CONNECTOR
# exec pm2 --watch="packages" -i 2 --ignore-watch="node_modules" --interpreter=babel-node start ./pm2-start.js -- --connector=$PATH_TO_CONNECTOR
