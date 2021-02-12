# build: docker build .-t hull-connectors
# launch shell: docker run -it hull-connectors /bin/sh

FROM node:12.20-alpine

RUN apk --no-cache add bash \
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
COPY packages/hull-sql/package.json /app/packages/hull-sql/
COPY packages/hull-sql-exporter/package.json /app/packages/hull-sql-exporter/
COPY packages/hull-connector-framework/package.json /app/packages/hull-connector-framework/
COPY packages/hull-vm/package.json /app/packages/hull-vm/
COPY packages/hull-webhooks/package.json /app/packages/hull-webhooks/
COPY packages/hull-lightweight/package.json /app/packages/hull-lightweight/
COPY packages/hullrepl/package.json /app/packages/hullrepl/

# CONNECTORS:
COPY packages/connectors/hull-account-processor/package.json /app/packages/connectors/hull-account-processor/package.json
COPY packages/connectors/hull-aircall/package.json /app/packages/connectors/hull-aircall/package.json
COPY packages/connectors/hull-clearbit/package.json /app/packages/connectors/hull-clearbit/package.json
COPY packages/connectors/hull-coppercrm/package.json /app/packages/connectors/hull-coppercrm/package.json
COPY packages/connectors/hull-customerio/package.json /app/packages/connectors/hull-customerio/package.json
COPY packages/connectors/hull-front/package.json /app/packages/connectors/hull-front/package.json
COPY packages/connectors/hull-hubspot/package.json /app/packages/connectors/hull-hubspot/package.json
COPY packages/connectors/hull-hubspot-deals/package.json /app/packages/connectors/hull-hubspot-deals/package.json
COPY packages/connectors/hull-incoming-webhooks/package.json /app/packages/connectors/hull-incoming-webhooks/package.json
COPY packages/connectors/hull-mailchimp/package.json /app/packages/connectors/hull-mailchimp/package.json
COPY packages/connectors/hull-marketo/package.json /app/packages/connectors/hull-marketo/package.json
COPY packages/connectors/hull-outgoing-account-webhooks/package.json /app/packages/connectors/hull-outgoing-account-webhooks/package.json
COPY packages/connectors/hull-outgoing-user-webhooks/package.json /app/packages/connectors/hull-outgoing-user-webhooks/package.json
COPY packages/connectors/hull-outreach/package.json /app/packages/connectors/hull-outreach/package.json
COPY packages/connectors/hull-pipedrive/package.json /app/packages/connectors/hull-pipedrive/package.json
COPY packages/connectors/hull-processor/package.json /app/packages/connectors/hull-processor/package.json
COPY packages/connectors/hull-repl/package.json /app/packages/connectors/hull-repl/package.json
COPY packages/connectors/hull-scheduled-calls/package.json /app/packages/connectors/hull-scheduled-calls/package.json
COPY packages/connectors/hull-segment/package.json /app/packages/connectors/hull-segment/package.json
COPY packages/connectors/hull-slack/package.json /app/packages/connectors/hull-slack/package.json
COPY packages/connectors/hull-typeform/package.json /app/packages/connectors/hull-typeform/package.json
COPY packages/connectors/hull-warehouse/package.json /app/packages/connectors/hull-warehouse/package.json
COPY packages/connectors/hull-website/package.json /app/packages/connectors/hull-website/package.json
COPY packages/connectors/hull-zapier/package.json /app/packages/connectors/hull-zapier/package.json
COPY packages/connectors/hull-salesforce/package.json /app/packages/connectors/hull-salesforce/package.json
COPY packages/connectors/hull-intercom/package.json /app/packages/connectors/hull-intercom/package.json
COPY packages/connectors/hull-intercom-legacy/package.json /app/packages/connectors/hull-intercom-legacy/package.json
COPY packages/connectors/hull-datanyze/package.json /app/packages/connectors/hull-datanyze/package.json
COPY packages/connectors/hull-google-sheets/package.json /app/packages/connectors/hull-google-sheets/package.json
COPY packages/connectors/hull-google-analytics/package.json /app/packages/connectors/hull-google-analytics/package.json
COPY packages/connectors/hull-bigquery/package.json /app/packages/connectors/hull-bigquery/package.json
COPY packages/connectors/hull-bigquery-importer/package.json /app/packages/connectors/hull-bigquery-importer/package.json
COPY packages/connectors/hull-facebook-audiences/package.json /app/packages/connectors/hull-facebook-audiences/package.json
COPY packages/connectors/hull-snowflake-importer/package.json /app/packages/connectors/hull-snowflake-importer/package.json
COPY packages/connectors/hull-madkudu/package.json /app/packages/connectors/hull-madkudu/package.json
COPY packages/connectors/hull-calendly/package.json /app/packages/connectors/hull-calendly/package.json
# COPY packages/connectors/hull-mysql-exporter/package.json /app/packages/connectors/hull-mysql-exporter/package.json
# COPY packages/connectors/hull-mssql-exporter/package.json /app/packages/connectors/hull-mssql-exporter/package.json
# COPY packages/connectors/hull-postgresql-exporter/package.json /app/packages/connectors/hull-postgresql-exporter/package.json

RUN yarn install --frozen-lockfile --no-cache --production

# If no package.json changed. then we start here.
COPY ./ /app/

# build the project
RUN yarn build

# This is preferred over ENTRYPOINT as it allows to override the default command in docker run -it
CMD [ "sh", "scripts/start-connector.sh" ]
