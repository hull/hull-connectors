#!/usr/bin/env bash
# this scripts starts the connector in dev

# if [ -f packages/connectors/$1/.env ]; then
#   source packages/connectors/$1/.env
#   cat packages/connectors/$1/.env
# fi

exec concurrently \
      -p "[{name}]" \
      -n ngrok,connector \
      --handle-input -c "bgBlue.bold,bgCyan.bold" \
      "yarn ngrok $1" \
      "babel-node \
          -- packages/hull/src/lightweight \
            --connector=packages/connectors/$1 \
            --type=$2"
# exec concurrently \
#       -p "[{name}]" \
#       -n client,connector,ngrok \
#       --handle-input -c "bgBlue.bold,bgCyan.bold" \
#       "yarn ngrok $1" \
#       "nodemon packages/connectors/$1 \
#         --ignore node_modules \
#         --require ./root-babel-register \
#         --inspect \
#         --exec babel-node \
#           -- packages/hull/src/lightweight \
#             --connector=package/connectors/$1 \
#             --type=$2"