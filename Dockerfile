FROM node:8.12-alpine

RUN apk add --no-cache rsync

# basic settings
WORKDIR /app
ENTRYPOINT sh /app/scripts/docker-entrypoint.sh

# copy only package.jsons and root yarn.lock to make use
# of docker layers caching
COPY package.json /app/
COPY yarn.lock /app/
COPY packages/hull/package.json /app/packages/hull/
COPY packages/hull-client/package.json /app/packages/hull-client/

# unfortunately we need to add each connector separately
COPY packages/connectors/hull-typeform/package.json /app/packages/connectors/hull-typeform/package.json

# install dependencies
RUN yarn && yarn cache clean


# copy rest of the files
COPY ./babel.config.js /app/
COPY ./packages /app/packages/

# run verification step which prevents from forgetting about adding
# new connector above
COPY ./scripts /app/scripts/
RUN sh /app/scripts/verify-connectors-packages.sh

# build the project
RUN yarn build

# quick workaround for heroku container requirements
ENTRYPOINT
CMD /app/scripts/docker-entrypoint.sh
