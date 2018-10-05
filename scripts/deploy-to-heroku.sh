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
WEB_DOCKER_IMAGE_ID=$(docker images -q hull-connectors)
docker tag hull-connectors registry.heroku.com/$HEROKU_APPLICATION/web
docker push registry.heroku.com/$HEROKU_APPLICATION/web


# heroku container:release web -a $HEROKU_APPLICATION

curl -n -X PATCH https://api.heroku.com/apps/$HEROKU_APPLICATION/formation \
  -d '{
  "updates": [
    {
      "type": "web",
      "docker_image": '"$WEB_DOCKER_IMAGE_ID"'
    }
  ]
}' \
  -H "Content-Type: application/json" \
  -H "Accept: application/vnd.heroku+json; version=3.docker-releases"
  -H "Authorization: Bearer $HEROKU_API_KEY"
