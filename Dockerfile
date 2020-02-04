# build: docker build .-t hull-connectors
# launch shell: docker run -it hull-connectors /bin/sh

FROM node:10.18-alpine

RUN apk --no-cache add \
      .build-deps \
      bash \
      bsd-compat-headers \
      ca-certificates \
      cyrus-sasl-dev \
      g++ \
      gcc \
      libc-dev \
      lz4-dev \
      make \
      musl-dev \
      openssl-dev \
      py-setuptools \
      python \
      rsync \
      zlib-dev

RUN apk add --no-cache --virtual .build-deps gcc zlib-dev libc-dev bsd-compat-headers py-setuptools rsync


# basic settings
WORKDIR /app

# # By copying the package.json files separately we speed up greatly the build phase.
COPY newrelic.js /app/
COPY babel.config.js /app/
COPY package.json /app/
COPY yarn.lock /app/


CMD rsync -mrv --include="*/" --include="package.json" --exclude="*" ./ /app/

COPY ./ /app/

# install dependencies
RUN yarn cache clean && yarn

# If no package.json changed. then we start here.

# build the project
RUN yarn build

# This is preferred over ENTRYPOINT as it allows to override the default command in docker run -it
CMD [ "sh", "scripts/bash-entrypoint.sh" ]
