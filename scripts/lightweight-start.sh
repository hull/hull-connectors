#!/usr/bin/env bash
# this scripts starts the connector in dev

if [ -f packages/connectors/$1/.env ]; then
  source packages/connectors/$1/.env
  cat packages/connectors/$1/.env
fi

exec concurrently \
      -p "[{name}]" \
      -n ngrok,connector \
      --handle-input -c "bgBlue.bold,bgCyan.bold" \
      "yarn ngrok $1" \
      "nodemon \
        --exec babel-node \
          -- packages/hull/src/lightweight \
            --inspect \
            --connector=packages/connectors/$1"