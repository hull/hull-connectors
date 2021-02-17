// @flow
import type { Connector, HullConnector, HullConnectorConfig } from "hull";

const _ = require("lodash");
const Hull = require("hull");
const handlers = require("hull/src/handlers");
const superagent = require("superagent");
const Minihull = require("minihull");
const nock = require("nock");
const express = require("express");
const jwt = require("jwt-simple");
const expect = require("expect");
const { EventEmitter } = require("events");
const debug = require("debug")("hull-test-scenario-runner");

const { equals } = require("expect/build/jasmineUtils");
const { iterableEquality } = require("expect/build/utils");

export type TestScenarioDefinition = Object => {
  handlerType: $Values<typeof handlers>,
  handlerUrl?: string,
  channel?: string,
  is_export?: boolean,
  accept_incoming_webhooks?: boolean,
  payload?: {
    body: Object,
    query: Object,
    headers: Object
  },
  connector: Object,
  usersSegments: Array<*>,
  accountsSegments: Array<*>,
  messages?: Array<*>,
  externalApiMock: Function,
  firehoseEvents: Array<*>,
  response: Object | string,
  responseStatusCode?: number,
  metrics: Array<*>,
  logs: Array<*>,
  platformApiCalls?: Array<*>
};

expect.extend({
  toEqualIgnoringOrder(received, expected, additionalInfo) {
    const copyOfReceived = _.cloneDeep(received);
    const copyOfExpected = _.cloneDeep(expected);

    try {
      expected.forEach(value => {
        const index = copyOfReceived.findIndex(item =>
          equals(item, value, [iterableEquality])
        );
        if (index === -1) {
          expect(received).toEqual(expected);
        }
        copyOfReceived.splice(index, 1);
      });
    } catch (error) {
      error.message = `${additionalInfo}: we did not receive following entries  \n     ${error.message}`;
      throw error;
    }

    try {
      received.forEach(value => {
        const index = copyOfExpected.findIndex(item =>
          equals(item, value, [iterableEquality])
        );
        if (index === -1) {
          expect(received).toEqual(expected);
        }
        copyOfExpected.splice(index, 1);
      });
    } catch (error) {
      error.message = `${additionalInfo}: we did not expect following entries  \n     ${error.message}`;
      throw error;
    }
    return {
      pass: true
    };
  }
});

class TestScenarioRunner extends EventEmitter {
  connectorConfig: HullConnectorConfig;

  minihull: typeof Minihull;

  nockScope: *;

  app: *;

  connector: Connector;

  connectorData: HullConnector;

  scenarioDefinition: *;

  rawScenarioDefinition: Function;

  deboucedFinish: *;

  finished: boolean;

  capturedMetrics: Array<*>;

  capturedLogs: Array<*>;

  connectorConfig: HullConnectorConfig;

  timeout: *;

  timeoutId: *;

  connector: Connector;

  debounceWait: number;

  server: Function;

  worker: Function | void;

  externalIncomingRequest: Function;

  connectorManifest: Object;

  constructor(
    {
      manifest,
      connectorConfig,
      debounceWait
    }: {
      connectorConfig: () => HullConnectorConfig,
      debounceWait?: number
    },
    scenarioDefinition: TestScenarioDefinition
  ) {
    super();
    expect.extend({
      whatever() {
        return {
          pass: true,
          message: ""
        };
      }
    });

    this.connectorConfig = {
      manifest,
      hostSecret: "please-dont-tell",
      ...connectorConfig()
    };
    this.connectorManifest = manifest;
    this.finished = false;
    this.timeout = 10000;
    this.debounceWait = 200;
    this.capturedMetrics = [];
    this.capturedLogs = [];
    this.minihull = new Minihull();
    this.app = express();
    this.rawScenarioDefinition = scenarioDefinition;

    if (debounceWait) {
      this.debounceWait = debounceWait;
    }
    this.deboucedFinish = _.debounce(() => this.finish(), this.debounceWait, {
      maxWait: this.timeout
    });

    this.minihull.on("incoming.request", req =>
      debug(">>>> MINIHULL", req.method, req.url)
    );
    this.minihull.on("incoming.request@/api/v1/firehose", this.deboucedFinish);
  }

  async finish() {
    debug("finish");
    try {
      if (this.finished === true) {
        throw new Error(
          "Scenario finshed multiple times, try to up `debounceWait` parameter"
        );
      }
      clearTimeout(this.timeoutId);
      this.finished = true;
      const transformedLogs = this.capturedLogs.map(
        ({ level, message, context, data }) => {
          return [
            level,
            message,
            _.omit(
              context,
              "organization",
              "id",
              "connector_name",
              "connector"
            ),
            data
          ];
        }
      );
      expect(transformedLogs).toEqualIgnoringOrder(
        this.scenarioDefinition.logs,
        "logs do not match"
      );
      expect(
        this.capturedMetrics.map(metric => {
          return [metric[0], metric[1], metric[2]];
        })
      ).toEqualIgnoringOrder(
        this.scenarioDefinition.metrics,
        "metrics do not match"
      );
      const firehoseEvents = this.minihull.requests
        .get("incoming")
        .filter({ url: "/api/v1/firehose" })
        .map("body.batch")
        .flatten()
        .map(entry => {
          const claims = _.omit(
            jwt.decode(entry.headers["Hull-Access-Token"], "1234"),
            "iss",
            "iat"
          );
          return [
            entry.type,
            _.omitBy(
              {
                asUser: claims["io.hull.asUser"],
                asAccount: claims["io.hull.asAccount"],
                subjectType: claims["io.hull.subjectType"]
              },
              _.isNil
            ),
            // @TODO check with Tim why we were omitting _.isNil -> this was filtering out `null` values
            entry.body
          ];
        })
        .value();
      expect(firehoseEvents).toEqualIgnoringOrder(
        this.scenarioDefinition.firehoseEvents,
        "firehoseEvents do not match"
      );
      if (this.nockScope && !this.nockScope.isDone()) {
        throw new Error(
          `pending mocks: ${JSON.stringify(this.nockScope.pendingMocks())}`
        );
      }
      debug("closing");
      const platformApiCalls = this.minihull.requests
        .get("incoming")
        .reject({ url: "/api/v1/firehose" })
        .map(entry => {
          return [entry.method, entry.url, entry.query, entry.body];
        })
        .value();
      expect(platformApiCalls).toEqualIgnoringOrder(
        this.scenarioDefinition.platformApiCalls || [],
        "platformApiCalls do not match"
      );
      nock.cleanAll();
      nock.enableNetConnect();
      nock.emitter.removeAllListeners();
      await this.minihull.close();
      await new Promise(resolve => {
        this.connector.server.close(() => resolve());
      });
    } catch (error) {
      return this.emit("error", error);
    }
    debug("finishing");
    return this.emit("finish");
  }

  async run() {
    return new Promise(async (resolve, reject) => {
      try {
        nock.disableNetConnect();
        nock.enableNetConnect("localhost");
        nock.emitter.on("no match", (req, options, requestBody) => {
          if (req.hostname !== "localhost" && options) {
            this.emit(
              "error",
              new Error(
                `Missing nock endpoint: ${options.method} ${options.hostname}${
                  options.path
                } ${JSON.stringify(requestBody)}`
              )
            );
          }
        });
        this.on("error", error => reject(error));
        this.on("finish", () => resolve());

        await this.minihull.listen(0);
        const { port: minihullPort } = this.minihull.server.address();

        this.connector = this.setupTestConnector(minihullPort);
        await this.connector.start();
        const { server } = this.connector;

        const { port: connectorPort } = server.address();
        this.scenarioDefinition = this.rawScenarioDefinition({
          expect,
          nock,
          handlers,
          connectorPort,
          minihullPort,
          alterFixture: (fixture, modification) => {
            // $FlowFixMe
            return _.defaultsDeep({}, modification, fixture); // eslint-disable-line global-require, import/no-dynamic-require
          }
        });
        if (
          this.scenarioDefinition.connector.accept_incoming_webhooks ===
          undefined
        ) {
          this.scenarioDefinition.connector.accept_incoming_webhooks = true;
        }
        this.nockScope =
          this.scenarioDefinition.externalApiMock &&
          this.scenarioDefinition.externalApiMock();
        if (this.nockScope) {
          this.nockScope.on("request", req => {
            debug(">>> NOCK REQUEST", req.path);
          });
          this.nockScope.on("replied", req => {
            debug(">>> NOCK", req.path);
          });
          this.nockScope.on("replied", this.deboucedFinish);
        }
        // this.server = this.scenarioDefinition.connectorServer;
        this.connectorData = _.defaults(this.scenarioDefinition.connector, {
          id: "9993743b22d60dd829001999",
          private_settings: {},
          manifest: this.connectorManifest
        });
        this.externalIncomingRequest = this.scenarioDefinition.externalIncomingRequest;

        this.minihull.stubConnector(this.connectorData);
        this.minihull.stubUsersSegments(this.scenarioDefinition.usersSegments);
        this.minihull.stubAccountsSegments(
          this.scenarioDefinition.accountsSegments
        );
        let response;
        const { handlerUrl, channel } = this.scenarioDefinition;
        switch (this.scenarioDefinition.handlerType) {
          case handlers.scheduleHandler:
            response = await this.minihull.postConnector(
              this.connectorData,
              `http://localhost:${connectorPort}/${handlerUrl}`,
              this.scenarioDefinition.usersSegments,
              this.scenarioDefinition.accountsSegments
            );
            break;
          // @TODO => it seems jsonHandler should not come from Platform but instead be a regular POST call -> confirm ?
          case handlers.jsonHandler:
            response = await superagent
              .post(`http://localhost:${connectorPort}/${handlerUrl}`)
              .query({
                organization: this.minihull._getOrgAddr(),
                ship: this.connectorData.id,
                secret: this.minihull.secret
              })
              .send({});
            break;
          case handlers.incomingRequestHandler:
            response = await this.externalIncomingRequest({
              superagent,
              connectorUrl: `http://localhost:${connectorPort}`,
              config: this.connectorConfig,
              plainCredentials: {
                organization: this.minihull._getOrgAddr(),
                ship: this.connectorData.id,
                secret: this.minihull.secret
              }
            });
            break;
          case handlers.batchHandler:
            if (channel === "user:update") {
              this.minihull.stubUsersBatch(this.scenarioDefinition.messages);
              response = await this.minihull.batchUsersConnector(
                this.connectorData,
                `http://localhost:${connectorPort}/${handlerUrl}`,
                this.scenarioDefinition.usersSegments,
                this.scenarioDefinition.accountsSegments
              );
            } else if (channel === "account:update") {
              this.minihull.stubAccountsBatch(this.scenarioDefinition.messages);
              response = await this.minihull.batchAccountsConnector(
                this.connectorData,
                `http://localhost:${connectorPort}/${handlerUrl}`,
                this.scenarioDefinition.usersSegments,
                this.scenarioDefinition.accountsSegments
              );
            } else {
              throw new Error(
                "Channel not supported for the batchHandler endpoint"
              );
            }
            break;
          case handlers.notificationHandler:
            try {
              response = await this.minihull.notifyConnector(
                this.connectorData,
                `http://localhost:${connectorPort}/${handlerUrl}`,
                channel,
                this.scenarioDefinition.messages,
                this.scenarioDefinition.usersSegments,
                this.scenarioDefinition.accountsSegments,
                this.scenarioDefinition.is_export
              );
            } catch (err){
              response = err.response;
            }
            break;
          case undefined:
            throw new Error("Wrong handlerType");
          default:
            throw new Error(
              `Wrong handlerType: ${this.scenarioDefinition.handlerType.name}`
            );
        }
        debug("response", response.text, response.body, response.statusCode);
        if (this.scenarioDefinition.response !== undefined) {
          expect(response.body).toEqual(this.scenarioDefinition.response);
        }
        if (this.scenarioDefinition.responseText !== undefined) {
          expect(response.text).toEqual(this.scenarioDefinition.responseText);
        }
        expect(response.statusCode).toEqual(
          this.scenarioDefinition.responseStatusCode || 200
        );
        this.timeoutId = setTimeout(() => {
          this.deboucedFinish.cancel();
          throw new Error("Scenario timeouted");
        }, this.timeout);
        this.deboucedFinish();
      } catch (error) {
        reject(error);
      }
    });
  }

  setupTestConnector(minihullPort: number) {
    return new Hull.Connector({
      manifest: {},
      ...this.connectorConfig,
      port: _.random(5000, 9000, false),
      hostSecret: "please-dont-tell",
      skipSignatureValidation: true,
      clientConfig: {
        ...this.connectorConfig.clientConfig,
        protocol: "http",
        firehoseUrl: `http://localhost:${minihullPort}/api/v1/firehose`,
        flushAt: 1,
        flushAfter: 1
      },
      metricsConfig: {
        ...this.connectorConfig.metricsConfig,
        captureMetrics: this.capturedMetrics
      },
      logsConfig: {
        ...this.connectorConfig.logsConfig,
        capture: true,
        logs: this.capturedLogs,
        level: "debug",
        transports: [
          {
            type: "file",
            options: {
              level: "debug",
              filename: "logs/test.log",
              tailable: true
            }
          }
        ]
      },
      disableOnExit: true
    });
  }
}

module.exports = TestScenarioRunner;
