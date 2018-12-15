#!/usr/bin/env bash
# this scripts starts the connector in dev

exec nodemon packages/connectors/$1/server --inspect --exec babel-node -- packages/connectors/$1/server
