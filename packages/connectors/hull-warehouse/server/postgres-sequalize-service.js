/* @flow */
import type { HullClientLogger, HullContext } from "hull";
import type { CustomApi, RawRestApi } from "hull-connector-framework/src/purplefusion/types";
import Sequelize from "sequelize";
const getPort = require('get-port');

const {
  isUndefinedOrNull
} = require("hull-connector-framework/src/purplefusion/utils");

const MetricAgent = require("hull/src/infra/instrumentation/metric-agent");
const { getSshTunnelConfig, getDatabaseConfig } = require("hull-connector-framework/src/purplefusion/ssh/ssh-utils");
const { SSHConnection } = require("hull-connector-framework/src/purplefusion/ssh/ssh-connection");
const { Client } = require("hull");
const { SkippableError } = require("hull/src/errors");

const _ = require("lodash");

const { normalizeFieldName } = require("./utils");

const HullVariableContext = require("hull-connector-framework/src/purplefusion/variable-context");

const {
  PostgresUserSchema,
  PostgresAccountSchema
} = require("./service-objects");

// class UserModel extends Sequelize.Model {};
// class AccountModel extends Sequelize.Model {};

// should be a generically instantiated class which take
// transforms-to-hull.js
// and maps the data back to account and traits calls....

const databases = {};
const sshConnections = {};

const EVENT_SCHEMA = {
  event_id: {
    type: Sequelize.STRING,
    primaryKey: true
  },
  user_id: Sequelize.STRING,
  event_source: Sequelize.STRING,
  app_name: Sequelize.STRING,
  event: Sequelize.STRING,
  event_type: Sequelize.STRING,
  created_at: Sequelize.DATE,
  session_id: Sequelize.STRING,
  app_id: Sequelize.STRING,
  anonymous_id: Sequelize.STRING,
  context: Sequelize.JSON,
  properties: Sequelize.JSON
};

const synchOptions = {
  logging: false,
  alter: true
};

function toBytesUTF8(chars) {
  return unescape(encodeURIComponent(chars));
}
function fromBytesUTF8(bytes) {
  return decodeURIComponent(escape(bytes));
}

function truncateByBytesUTF8(chars, n) {
  const rawBytes = toBytesUTF8(chars);
  if (rawBytes.length < 255) {
    return chars;
  }
  let bytes = rawBytes.substring(0, n);
  while (true) {
    try {
      return fromBytesUTF8(bytes);
    } catch(e) {};
    bytes = bytes.substring(0, bytes.length-1);
  }
}

class SequalizeSdk {
  api: CustomApi;

  metricsClient: MetricAgent;

  loggerClient: HullClientLogger;

  helpers: Object;

  connectorId: string;

  connectionString: string;

  userTableName: string;

  eventTableName: string;

  accountTableName: string;

  ascii_encoded: boolean;

  use_native_json: boolean;

  constructor(globalContext: HullVariableContext, api: CustomApi) {
    const reqContext = globalContext.reqContext();
    this.ascii_encoded = globalContext.get("connector.private_settings.ascii_encoded_database") === true;
    this.use_native_json = globalContext.get("connector.private_settings.use_native_json_field_type") === true;
    this.api = api;
    this.loggerClient = reqContext.client.logger;
    this.metricsClient = reqContext.metric;
    this.helpers = reqContext.helpers;
    this.connectorId = reqContext.connector.id;
    this.privateSettings = reqContext.connector.private_settings;

    const username = reqContext.connector.private_settings.db_username;
    const password = reqContext.connector.private_settings.db_password;
    const hostname = reqContext.connector.private_settings.db_hostname;
    const name = reqContext.connector.private_settings.db_name;
    const port = reqContext.connector.private_settings.db_port;

    this.sshConfig = getSshTunnelConfig(this.privateSettings);
    this.dbConfig = getDatabaseConfig(this.privateSettings);
    this.connectionString = `postgres://${username}:${password}@${hostname}:${port}/${name}?ssl=true`;

    this.userTableName =
      reqContext.connector.private_settings.db_user_table_name;
    this.accountTableName =
      reqContext.connector.private_settings.db_account_table_name;
    this.eventTableName =
      reqContext.connector.private_settings.db_events_table_name;
  }

  async closeDatabaseConnectionIfExists() {
    try {
      if (databases[this.connectorId]) {
        await databases[this.connectorId].close();
        _.unset(databases, this.connectorId);
      }
    } catch (error) {
      const message = _.get(error, "message", "Unknown Error Closing Database Connection");
      this.loggerClient.error("incoming.job.error", { jobName: "sync", hull_summary: message });
    }

    try {
      if (sshConnections[this.connectorId]) {
        await sshConnections[this.connectorId].shutdown();
        _.unset(sshConnections, this.connectorId);
      }
    } catch (error) {
      const message = _.get(error, "message", "Unknown Error Closing SSH Client");
      this.loggerClient.error("incoming.job.error", { jobName: "sync", hull_summary: message });
    }
  }

  requireSshTunnel() {
    return !_.isEmpty(_.get(this.privateSettings, "ssh_host"));
  }

  getSequelizeTunnelConnection(): Sequelize {
    return getPort().then((portForward) => {
      sshConnections[this.connectorId] = new SSHConnection({
        endPort: this.sshConfig.port,
        endHost: this.sshConfig.host,
        username: this.sshConfig.user,
        privateKey: this.sshConfig.privateKey
      });

      return sshConnections[this.connectorId].forward({
        fromPort: portForward,
        toPort: this.dbConfig.port,
        toHost: this.dbConfig.host
      }).then(() => {
        const username = this.privateSettings.db_username;
        const password = this.privateSettings.db_password;
        const database = this.privateSettings.db_name;

        return new Sequelize(database, username, password, {
          host: '127.0.0.1',
          port: portForward,
          dialect: 'postgres',
          define: {
            freezeTableName: true
          },
          logging: false
        });
      });
    });
  }

  getSequelizeConnection(): Sequelize {

    return new Promise((resolve, reject) => {
      if (!databases[this.connectorId]) {
        const opts = {
          define: {
            // prevent sequelize from pluralizing table names
            freezeTableName: true
          },
          logging: false
        };

        if (this.requireSshTunnel()) {
          try {
            return this.getSequelizeTunnelConnection().then((sequelizeConnection) => {
              databases[this.connectorId] = sequelizeConnection;
              return resolve(databases[this.connectorId]);
            });
          } catch (error) {
            reject(error);
          }
        } else {
          databases[this.connectorId] = new Sequelize(this.connectionString, opts);
        }
      }

      return resolve(databases[this.connectorId]);
    });
  }

  async dispatch(methodName: string, params: any) {
    return this[methodName](params);
  }

  async createAccountSchema(hullAccountSchema: Array<any>) {
    return this.generateSequelizeSchema(hullAccountSchema);
  }

  async createUserSchema(hullUserSchema: Array<any>) {
    const userSchema = this.generateSequelizeSchema(hullUserSchema);

    userSchema.account_id = {
      type: Sequelize.STRING
    };

    return userSchema;
  }

  async createEventSchema() {
    return EVENT_SCHEMA;
  }

  /**
   * MUST return a new object, and not a reference object
   * sequalize mutates this when you pass it in
   * @returns {Promise<{indexes: {unique: string, fields: string[]}[]}>}
   */
  async createEventIndexes() {
    return {
      indexes:[
        {
          unique: false ,
          fields:['user_id']
        }
      ]
    };
  }

  async initSchema(params: { schema: any, tableName: string, indexes: Object } ) {
    return this.getSequelizeConnection().then((sequelizeConnection) => {
      return sequelizeConnection.define(
        params.tableName,
        params.schema,
        params.indexes
      );
    });
  }

  async syncTableSchema(tableName: string) {
    return this.getSequelizeConnection().then((sequelizeConnection) => {
      return sequelizeConnection.model(tableName).sync(synchOptions);
    });
  }

  async databaseConnectionSuccess() {
    try {
      const sequelizeConnection = await this.getSequelizeConnection();
      const result = await sequelizeConnection
        .model(this.accountTableName)
        .findAll({
          limit: 1,
          attributes: [[Sequelize.fn("COUNT", "*"), "totalcount"]]
        });
      return { status: "allgood" };
    } catch (err) {
      return { errorMessage: err.message };
    }
  }

  generateSequelizeSchema(schemaObject: any) {
    let hullSchema = schemaObject;
    if (!Array.isArray(hullSchema)) {
      hullSchema = hullSchema.arrayOfAttributes;
    }
    const fields = {};

    _.forEach(hullSchema, attribute => {
      // only add the attribute if the it's visible and it's not an inherited account attribute
      if (
        attribute.key.indexOf("account.") < 0 &&
        attribute.visible &&
        attribute.type !== "event"
      ) {
        fields[normalizeFieldName(attribute.key)] = attribute;
      }
    });

    const sequalizeSchema = {};
    _.forEach(fields, (attribute, normalizedAttributeKey) => {
      if (/^\d+$/.test(normalizedAttributeKey)) {
        return;
      }
      // type: "string", "boolean", "number", "date"
      // arrays are inferred, and can be arrays of any of the data types

      const type = attribute.type;
      let sequalizeDataType = Sequelize.STRING;
      if (type === "date") {
        sequalizeDataType = Sequelize.DATE;
      } else if (type === "number") {
        sequalizeDataType = Sequelize.DOUBLE;
      } else if (type === "boolean") {
        sequalizeDataType = Sequelize.BOOLEAN;
      } else if (this.use_native_json && type === "json") {
        sequalizeDataType = Sequelize.JSON;
      } else if (attribute.key === "anonymous_ids") {
        sequalizeSchema["anonymous_ids_array"] = Sequelize.ARRAY(Sequelize.STRING);
      }

      sequalizeSchema[normalizedAttributeKey] = sequalizeDataType;
    });

    sequalizeSchema.id = {
      type: Sequelize.STRING,
      primaryKey: true
    };
    // for account and user segments
    sequalizeSchema.segments = {
      type: Sequelize.TEXT
    };
    return sequalizeSchema;
  }

  containsNewAttribute(params: { messages: Array<any>, schema: any, path: string }) {
    const schema = params.schema;
    const path = params.path;

    return _.some(params.messages, message => {
      // Remember, when creating the object, we'll still put these fields in the payload
      // but the sequelize library "gracefully" handles attributes that don't map
      // where it will just exclude them from being sent
      const reservedAttributes = ["indexed_at", "updated_at", "segment_ids", "doctype"];

      return _.some(_.get(message, path), (value, key) => {
        let normalizedName = normalizeFieldName(key);

        if (reservedAttributes.indexOf(normalizedName) >= 0) {
          return false;
        }

        if (!schema[normalizedName]) {
          return true;
        }

        return false;
      });
    });
  }


  createSequelizedObject(objectToSend: any) {
    const objectToUpsert = {};
    _.forEach(objectToSend, (value, key) => {
      let normalizedName = normalizeFieldName(key);

      let valueToUpsert = value;
      if (Array.isArray(value)) {
        if (value.length > 0) {
          if (normalizedName === "anonymous_ids") {
            objectToUpsert["anonymous_ids_array"] = value;
          }
          valueToUpsert = JSON.stringify(value);
        } else {
          valueToUpsert = null;
        }
      } else if (
        !isUndefinedOrNull(value) &&
        _.isPlainObject(value) &&
        !this.use_native_json
      ) {
        valueToUpsert = JSON.stringify(value);
      }
      if (/_at$/.test(normalizedName)) {
        const parsedDate = Date.parse(valueToUpsert);
        if (!_.isNaN(parsedDate)) {
          objectToUpsert[normalizedName] = parsedDate;
        }
      } else {
        if (typeof valueToUpsert === "string") {

          if (this.ascii_encoded) {
            valueToUpsert = truncateByBytesUTF8(valueToUpsert, 254);
          } else if (valueToUpsert.length >= 255) {
            valueToUpsert = valueToUpsert.substring(0, 254);
          }
        }

        objectToUpsert[normalizedName] = valueToUpsert;
      }
    });

    return objectToUpsert;
  }

  async upsertHullAccount(message: any) {
    const sequelizedAccount = this.createSequelizedObject(message.account);
    if (message.account_segments) {
      const segments = [];
      _.forEach(message.account_segments, segment => {
        if (!isUndefinedOrNull(segment)) {
          segments.push(segment.name);
        }
      });
      sequelizedAccount.segments = JSON.stringify(segments);
    }
    return this.getSequelizeConnection().then((sequelizeConnection) => {
      return sequelizeConnection.model(this.accountTableName).upsert(sequelizedAccount);
    });
  }

  async upsertHullUser(message: any) {

    // https://stackoverflow.com/questions/48124949/nodejs-sequelize-bulk-upsert

    // looks like updateOnDuplicate does not work for postgres
    // https://github.com/sequelize/sequelize/issues/4324
    //   return this.sequelize.model(`${this.connectorId}-user`)
    //     .bulkCreate(users.map(user => this.createSequelizedObject(user)), {
    //       updateOnDuplicate: ["id"]
    //     })
    //     .then(createdUser => {
    //       console.log(`Created User: ${JSON.stringify(createdUser)}`);
    //     });

    const sequelizedUser = this.createSequelizedObject(message.user);
    if (message.account) {
      sequelizedUser.account_id = message.account.id;
    }

    if (message.segments) {
      const segments = [];
      _.forEach(message.segments, segment => {
        if (!isUndefinedOrNull(segment)) {
          segments.push(segment.name);
        }
      });
      sequelizedUser.segments = JSON.stringify(segments);
    }

    if (!sequelizedUser.id) {
      return Promise.resolve();
    }
    return this.getSequelizeConnection().then((sequelizeConnection) => {
      return sequelizeConnection.model(this.userTableName)
        .upsert(sequelizedUser)
        .then(() => {
          if (message.events) {
            return Promise.all(
              message.events.map(event => {
                if (typeof event.event !== "string") {
                  event.event = "Invalid Name";
                }
                return this.getSequelizeConnection().then((sequelizeConnection) => {
                  return sequelizeConnection.model(this.eventTableName).upsert(event);
                });
              })
            );
          }
          return Promise.resolve();
        });
    })
  }

  async mergeHullUser(
    {
      previous,
      merged
    }: {
      previous: String,
      merged: String
    }
  ) {
    return this.getSequelizeConnection().then((sequelizeConnection) => {
      return sequelizeConnection.model(this.eventTableName)
        .update(
          {
            user_id: merged
          },
          {
            where: {
              user_id: previous
            }
          })
        .then(() => {
          return this.getSequelizeConnection().then((sequelizeConnection) => {
            return sequelizeConnection .model(this.userTableName)
              .destroy({
                where: {
                  id: previous
                }
              });
          })
        });
    });
  }

  async removeHullAccount(id: String) {
    return this.getSequelizeConnection().then((sequelizeConnection) => {
      return sequelizeConnection.model(this.accountTableName)
        .destroy({
          where: {
            id
          }
        });
    });
  }
}

const postgresSdk = ({ clientID, clientSecret } : {
  clientID: string,
  clientSecret: string
}): CustomApi => ({
  initialize: (context, api) => new SequalizeSdk(context, api),
  endpoints: {
    createUserSchema: {
      method: "createUserSchema",
      endpointType: "upsert",
      batch: true,
      input: PostgresUserSchema
    },
    createAccountSchema: {
      method: "createAccountSchema",
      endpointType: "upsert",
      batch: true,
      input: PostgresAccountSchema
    }
  },
  error: {
    templates: []
  }
});

module.exports = postgresSdk;
