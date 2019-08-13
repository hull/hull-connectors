# Postgres Warehouse Connector

## Connector development

This section describe technical aspects of the connector code.

### Repository structure

This is a basic repository structure descibed.
```text
root/

  server/    - Server-side code for the connector
    glue.js  - Includes all of the logic for orchestrating communication with hull/kafkaconnect/schemaregistry/kafka
    index.js - Creates a Hull Router that uses the manifest/glue/transforms/services and autowires all the routes
    kafka-connect-jdbc-service.js - Contains the rest endpoint abstractions for kafka connect task management - called by the glue
    kafka-service.js - Contains the CustomSdk for sending to the kafka service - called by the glue
    kafka-service-objects.js - Contains the definitions for the objects that kafka can receive
    schema-registry-service.js - The CustomSdk for creating and updateing an Avro schema - called by the glue
    schema-registry-service-objects.js - Not currently used, but should contain the definition for the schema registry objects
    transforms-to-kafka-service.js - Defines transformations from HullUser to the format that kafka accepts
    transforms-to-schema-registry-service - Contains the transforms from HullSchema to AvroSchema - Not currently used
```

### Developing

To successfully build the sources on your machine, make sure that you have the correct version of node along with one package manager installed. See `engines` in [package.json](/package.json) for details.

1. First you must build the workspace.  Remember it currently depends on librdkafka which is a native library, so you must first install it.
Installation instructions for the native library are here: https://github.com/edenhill/librdkafka
 
2. Before you can build the connector workspace, (on mac) make sure to set these environment variables, otherwise it won't build:
export CPPFLAGS=-I/usr/local/opt/openssl/include
export LDFLAGS=-L/usr/local/opt/openssl/lib

3. Build the workspace by calling "yarn"

4. Set the ENV variables to use for kafka, schema-registry and kafka-connect

Kafka VAR and default (Make sure to not add the http prefix):
KAFKA_BROKER_PATH=localhost:9092

Schema Registry VAR and default:
SCHEMA_REGISTRY_URL=http://localhost:8081

Kafka Connect VAR and default:
KAFKA_CONNECT_MANAGEMENT_URL=http://localhost:8083

5. yarn dev hull-warehouse
- Will startup the connector

6. Once the connector is installed in a Hull organization, the primary thing that needs configuration is the jdbc url.
The format for said url is: jdbc:postgresql://URL:PORT/DATABASENAME
