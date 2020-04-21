# build: docker build .-t hull-connectors
# launch shell: docker run -it hull-connectors /bin/sh

FROM node:10.18-alpine

RUN apk --no-cache add nginx bash \
      g++ \
      ca-certificates \
      lz4-dev \
      musl-dev \
      cyrus-sasl-dev \
      openssl-dev \
      make \
      python

RUN apk add --no-cache --virtual .build-deps gcc zlib-dev libc-dev bsd-compat-headers py-setuptools rsync

# basic settings
WORKDIR /app

# # By copying the package.json files separately we speed up greatly the build phase.
COPY newrelic.js /app/
COPY babel.config.js /app/
COPY package.json /app/
COPY yarn.lock /app/

COPY packages/hull/package.json /app/packages/hull/
COPY packages/hull-client/package.json /app/packages/hull-client/
COPY packages/hull-connector-framework/package.json /app/packages/hull-connector-framework/
COPY packages/hull-vm/package.json /app/packages/hull-vm/
COPY packages/hullrepl/package.json /app/packages/hullrepl/

# CONNECTORS:
COPY packages/connectors/hull-account-processor/package.json /app/packages/connectors/hull-account-processor/package.json
COPY packages/connectors/hull-aircall/package.json /app/packages/connectors/hull-aircall/package.json
COPY packages/connectors/hull-clearbit/package.json /app/packages/connectors/hull-clearbit/package.json
COPY packages/connectors/hull-customerio/package.json /app/packages/connectors/hull-custermio/package.json
COPY packages/connectors/hull-front/package.json /app/packages/connectors/hull-front/package.json
COPY packages/connectors/hull-hubspot/package.json /app/packages/connectors/hull-hubspot/package.json
COPY packages/connectors/hull-hubspot-deals/package.json /app/packages/connectors/hull-hubspot-deals/package.json
COPY packages/connectors/hull-incoming-webhooks/package.json /app/packages/connectors/hull-incoming-webhooks/package.json
COPY packages/connectors/hull-mailchimp/package.json /app/packages/connectors/hull-mailchimp/package.json
COPY packages/connectors/hull-marketo/package.json /app/packages/connectors/hull-marketo/package.json
COPY packages/connectors/hull-outreach/package.json /app/packages/connectors/hull-outreach/package.json
COPY packages/connectors/hull-pipedrive/package.json /app/packages/connectors/hull-pipedrive/package.json
COPY packages/connectors/hull-processor/package.json /app/packages/connectors/hull-processor/package.json
COPY packages/connectors/hull-scheduled-calls/package.json /app/packages/connectors/hull-scheduled-calls/package.json
COPY packages/connectors/hull-slack/package.json /app/packages/connectors/hull-slack/package.json
COPY packages/connectors/hull-typeform/package.json /app/packages/connectors/hull-typeform/package.json
COPY packages/connectors/hull-warehouse/package.json /app/packages/connectors/hull-warehouse/package.json
COPY packages/connectors/hull-website/package.json /app/packages/connectors/hull-website/package.json
COPY packages/connectors/hull-zapier/package.json /app/packages/connectors/hull-zapier/package.json

RUN yarn install --frozen-lockfile --no-cache --production

# If no package.json changed. then we start here.
COPY ./ /app/

# build the project
RUN yarn build

# This is preferred over ENTRYPOINT as it allows to override the default command in docker run -it
CMD [ "sh", "scripts/bash-entrypoint.sh" ]
