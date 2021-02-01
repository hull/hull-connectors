# Postgres Exporter Connector

## Connector development

This section describe technical aspects of the connector code.

### Repository structure

This is a basic repository structure described.
```text
root/

  server/    - Server-side code for the connector
    glue.js  - Includes all of the logic for orchestrating
```

### Developing

To successfully build the sources on your machine, make sure that you have the correct version of node along with one package manager installed. See `engines` in [package.json](/package.json) for details.


1. Build the workspace by calling "yarn"

2. yarn dev hull-warehouse
- Will startup the connector
