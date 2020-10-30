#!/usr/bin/env bash
# this scripts starts the connector in dev

if [ -f packages/connectors/$1/.env ]; then
  source packages/connectors/$1/.env
fi


CONNECTOR="packages/connectors/$1" webpack serve --config ./webpack/webpack.config.dev.js