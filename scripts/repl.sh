#!/usr/bin/env bash
# this scripts starts the connector in dev

if [ -f packages/connectors/$1/.env ]; then
  source packages/connectors/$1/.env
fi

exec nodemon packages/connectors/$1/server --inspect --exec babel-node -- packages/connectors/$1/server --repl $@
