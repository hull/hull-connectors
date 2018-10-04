#!/bin/sh

docker build -t hull-connectors .
docker tag hull-connectors registry.heroku.com/$CONNECTOR-staging/web
docker push registry.heroku.com/$CONNECTOR-staging/web
heroku container:release web -a $CONNECTOR-staging
