#!/usr/bin/env bash
# this scripts starts the connector in dev

PATH_TO_CONNECTOR="packages/connectors/$1"

if [ -f "$PATH_TO_CONNECTOR/.env" ]; then
  source "$PATH_TO_CONNECTOR/.env"
  cat "$PATH_TO_CONNECTOR/.env"
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
            --connector=$PATH_TO_CONNECTOR"