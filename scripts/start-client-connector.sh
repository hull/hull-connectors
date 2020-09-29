#!/usr/bin/env bash
# this scripts starts the connector in dev

if [ -f packages/connectors/$1/.env ]; then
  source packages/connectors/$1/.env
fi

exec webpack-dev-server --config ./webpack/webpack.config.dev.js --source packages/connectors/$1
