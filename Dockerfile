FROM node:10.15-alpine

RUN apk add --no-cache rsync

# basic settings
WORKDIR /app

ARG CONNECTOR=''
ENV CONNECTOR=${CONNECTOR}

COPY package.json /app/
COPY yarn.lock /app/
COPY packages/hull/package.json /app/packages/hull/
COPY packages/hull-client/package.json /app/packages/hull-client/
COPY packages/hull-connector-framework/package.json /app/packages/hull-connector-framework/
COPY packages/hull-repl/package.json /app/packages/hull-repl/

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

COPY newrelic.js /app/
COPY babel.config.js /app/

# install dependencies
RUN yarn cache clean && yarn

COPY packages/connectors/${CONNECTOR}/ /app/packages/connectors/${CONNECTOR}
COPY packages/assets/ /app/packages/assets/
COPY packages/hull/ /app/packages/hull/
COPY packages/hull-client/ /app/packages/hull-client/
COPY packages/hull-vm/ /app/packages/hull-vm/
COPY packages/hull-connector-framework/ /app/packages/hull-connector-framework/
COPY packages/hull-repl/ /app/packages/hull-repl/

COPY ./scripts /app/scripts/

# build the project
RUN yarn build

ENTRYPOINT node --optimize_for_size -r newrelic "dist/${CONNECTOR}/server"
