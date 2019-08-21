/* @flow */
import type { HullClientLogger, HullContext } from "hull";
import type { CustomApi, RawRestApi } from "hull-connector-framework/src/purplefusion/types";

const {
  isUndefinedOrNull
} = require("hull-connector-framework/src/purplefusion/utils");

const MetricAgent = require("hull/src/infra/instrumentation/metric-agent");
const { Client } = require("hull");

const { SkippableError } = require("hull/src/errors");

const _ = require("lodash");

const { normalizeFieldName } = require("./utils");

const Sequelize = require("sequelize");

const HullVariableContext = require("hull-connector-framework/src/purplefusion/variable-context");

// class UserModel extends Sequelize.Model {};
// class AccountModel extends Sequelize.Model {};

// should be a generically instantiated class which take
// transforms-to-hull.js
// and maps the data back to account and traits calls....

const databases = {};

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

  constructor(globalContext: HullVariableContext, api: CustomApi) {
    const reqContext = globalContext.reqContext();
    this.api = api;
    this.loggerClient = reqContext.client.logger;
    this.metricsClient = reqContext.metric;
    this.helpers = reqContext.helpers;
    this.connectorId = reqContext.connector.id;

    const username = reqContext.connector.private_settings.db_username;
    const password = reqContext.connector.private_settings.db_password;
    const hostname = reqContext.connector.private_settings.db_hostname;
    const name = reqContext.connector.private_settings.db_name;
    const port = reqContext.connector.private_settings.db_port;
    this.connectionString = `postgres://${username}:${password}@${hostname}:${port}/${name}?ssl=true`;

    this.userTableName =
      reqContext.connector.private_settings.db_user_table_name;
    this.accountTableName =
      reqContext.connector.private_settings.db_account_table_name;
    this.eventTableName =
      reqContext.connector.private_settings.db_events_table_name;
  }

  async closeDatabaseConnectionIfExists() {
    if (databases[this.connectorId]) {
      await databases[this.connectorId].close();
      _.unset(databases, this.connectorId);
    }
  }


  getSequelizeConnection(): Sequelize {
    if (!databases[this.connectorId]) {
      const opts = {
        define: {
          // prevent sequelize from pluralizing table names
          freezeTableName: true
        }
      };
      databases[this.connectorId] = new Sequelize(this.connectionString, opts);
    }

    return databases[this.connectorId];
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

  async initSchema(params: { schema: any, tableName: string } ) {
    return this.getSequelizeConnection().define(
      params.tableName,
      params.schema
    );
  }

  async syncTableSchema(tableName: string) {
    return this.getSequelizeConnection()
      .model(tableName)
      .sync(synchOptions);
  }

  async databaseConnectionSuccess() {
    try {
      const result = await this.getSequelizeConnection()
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

  generateSequelizeSchema(hullSchema: Array<any>) {
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
      const reservedAttributes = ["indexed_at", "updated_at", "segment_ids"];

      return _.some(_.get(message, path), (value, key) => {
        let normalizedName = normalizeFieldName(key);

        if (reservedAttributes.indexOf(normalizedName) >= 0) {
          return false;
        }

        // if (normalizedName.length >= 64) {
        //   return;
        // }

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
          valueToUpsert = JSON.stringify(value);
        } else {
          valueToUpsert = null;
        }
      } else if (
        !isUndefinedOrNull(value) &&
        typeof value === "object" &&
        Object.keys(value).length > 0
      ) {
        valueToUpsert = JSON.stringify(value);
      }
      if (/_at$/.test(normalizedName)) {
        const parsedDate = Date.parse(valueToUpsert);
        if (!_.isNaN(parsedDate)) {
          objectToUpsert[normalizedName] = parsedDate;
        }
      } else {
        if (typeof valueToUpsert === "string" && valueToUpsert.length > 255)
          valueToUpsert = valueToUpsert.substring(0, 255);
        objectToUpsert[normalizedName] = valueToUpsert;
      }
    });

    return objectToUpsert;
  }

  async upsertHullAccount(messages: Array<any>) {
    return Promise.all(
      messages.map(message => {
        const sequelizedAccount = this.createSequelizedObject(message.account);
        if (message.account_segments) {
          const segments = message.account_segments.map(segment => {
            return segment.name;
          });
          sequelizedAccount.segments = JSON.stringify(segments);
        }
        return this.getSequelizeConnection()
          .model(this.accountTableName)
          .upsert(sequelizedAccount);
    }));
  }

  async upsertHullUser(messages: Array<any>) {

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

    return Promise.all(
      messages.map(message => {
        const sequelizedUser = this.createSequelizedObject(message.user);
        if (message.account) {
          sequelizedUser.account_id = message.account.id;
        }

        if (message.segments) {
          const segments = message.segments.map(segment => {
            return segment.name;
          });
          sequelizedUser.segments = JSON.stringify(segments);
        }

        if (!sequelizedUser.id) {
          return Promise.resolve();
        }
        return this.getSequelizeConnection()
          .model(this.userTableName)
          .upsert(sequelizedUser)
          .then(() => {
            if (message.events) {
              return Promise.all(
                message.events.map(event => {
                  if (typeof event.event !== "string") {
                    event.event = "Invalid Name";
                  }
                  return this.getSequelizeConnection()
                    .model(this.eventTableName)
                    .upsert(event);
                })
              );
            }
            return Promise.resolve();
          });
    }));
  }
}

const postgresSdk = ({ clientID, clientSecret } : {
  clientID: string,
  clientSecret: string
}): CustomApi => ({
  initialize: (context, api) => new SequalizeSdk(context, api),
  error: {
    templates: [
      {
        truthy: { name: "SequelizeConnectionRefusedError" },
        errorType: SkippableError,
        message: "Database not accessible"
      },
      {
        truthy: { name: "SequelizeConnectionError" },
        errorType: SkippableError,
        message: "Unknown error"
      }
    ]
  }
});

module.exports = postgresSdk;
