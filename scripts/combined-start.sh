#!/usr/bin/env bash
# this scripts starts the connector in dev and ngrok

exec concurrently -p "[{name}]" -n client,connector,ngrok --handle-input -c "bgBlue.bold,bgCyan.bold" "yarn client $1" "yarn dev $1" "yarn ngrok $1"
