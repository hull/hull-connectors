#!/bin/sh

# This is the entrypoint script for docker image
# it requires `CONNECTOR` variable to be set
# and runs selected connector

: "${CONNECTOR:?CONNECTOR variable not set or empty}"

exec node dist/connectors/${CONNECTOR}/server
