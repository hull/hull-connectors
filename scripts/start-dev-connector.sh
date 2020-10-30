#!/usr/bin/env bash
# this scripts starts the connector in dev

if [ -f packages/connectors/$1/.env ]; then
  source packages/connectors/$1/.env
  cat packages/connectors/$1/.env
fi

# exec nodemon packages/connectors/$1/server --ignore node_modules --inspect --exec babel-node -- packages/connectors/$1/server
# exec pm2 --watch="../" --ignore-watch="node_modules" --interpreter=babel-node start ./packages/connectors/$1/server
# exec pm2 --watch="../" --ignore-watch="node_modules" --interpreter=babel-node start ./pm2-start.js -- --connector=$1
pm2 -f -i max start --watch="../packages" --ignore-watch="node_modules" ./pm2-start.js -- --connector=hull-processor 
# exec nodemon packages/connectors/$1/server --ignore node_modules --ignore packages/connectors/$1/src --inspect --exec babel-node -- packages/connectors/$1/server
