#!/bin/sh
# this scripts starts the connector in dev



exec nodemon --exec babel-node -- packages/connectors/$1/server
