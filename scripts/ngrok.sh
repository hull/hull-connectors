#!/usr/bin/env bash
echo "Starting NGROK on https://$1.eu.ngrok.io and https://$1.ngrok.io"
ngrok http 8082 --region eu --subdomain $1
