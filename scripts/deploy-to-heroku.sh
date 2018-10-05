#!/bin/sh

# This is a script which reads `deployment.config.js` file
# to get the name of heroku application which we want to deploy
# then build the image and deploy it

: "${CONNECTOR:?CONNECTOR variable not set or empty}"

: "${BRANCH:?BRANCH variable not set or empty}"

if [ ! -f deployment.config.js ]; then
  echo "deployment.config.js file not found, please get the configuration"
  exit 1
fi

HEROKU_APPLICATION=`node -p 'require("./deployment.config.js").connectors["hull-typeform"].master'`
echo "deploying $CONNECTOR at branch $BRANCH to application $HEROKU_APPLICATION"

docker build -t hull-connectors .
docker tag hull-connectors registry.heroku.com/$HEROKU_APPLICATION/web
docker push registry.heroku.com/$HEROKU_APPLICATION/web
heroku container:release web -a $HEROKU_APPLICATION
