// @flow
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

const { equals } = require("expect/build/jasmine_utils");
const { iterableEquality } = require("expect/build/utils");

export type TestScenarioDefinition = Object => {
  handlerType: $Values<typeof handlers>,
  handlerUrl?: string,
  channel?: string,
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
      error.message = `${additionalInfo}: we did not receive following entries  \n     ${
        error.message
      }`;
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
      error.message = `${additionalInfo}: we did not expect following entries  \n     ${
        error.message
      }`;
      throw error;
    }
    return {
      pass: true
    };
  }
});

class TestScenarioRunner extends EventEmitter {
  minihull: typeof Minihull;

  nockScope: *;

  app: *;

  hullConnector: *;

  scenarioDefinition: *;

  rawScenarioDefinition: Function;

  deboucedFinish: *;

  finished: boolean;

  capturedMetrics: Array<*>;

  capturedLogs: Array<*>;

  hullConnectorPort: number;

  hullConnectorServer: *;

  minihullPort: number;

  timeout: *;

  timeoutId: *;

  connector: Object;

  debounceWait: number;

  server: Function;

  worker: Function | void;

  externalIncomingRequest: Function;

  connectorManifest: Object;

  constructor(
    {
      connectorServer,
      connectorWorker,
      connectorManifest
    }: {
      connectorServer: express => express,
      connectorWorker?: Function,
      connectorManifest: Object
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

    this.connectorManifest = connectorManifest;
    this.finished = false;
    // this.hullConnectorPort = 9091;
    // this.minihullPort = 9092;
    this.timeout = 10000;
    this.debounceWait = 200;
    this.capturedMetrics = [];
    this.capturedLogs = [];
    this.minihull = new Minihull();
    this.app = express();
    this.rawScenarioDefinition = scenarioDefinition;
    this.deboucedFinish = _.debounce(() => this.finish(), this.debounceWait, {
      maxWait: this.timeout
    });
    this.server = connectorServer;
    this.worker = connectorWorker;

    this.minihull.on("incoming.request", req =>
      console.log(">>>> MINIHULL", req.method, req.url)
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
      const transformedLogs = this.capturedLogs.map(log => {
        return [
          log.level,
          log.message,
          _.omit(log.context, "organization", "id", "connector_name"),
          log.data
        ];
      });
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
            _.omitBy(entry.body, _.isNil)
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
        this.hullConnectorServer.close(() => resolve());
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
        this.on("error", error => {
          reject(error);
        });
        this.on("finish", () => {
          resolve();
        });
        await this.minihull.listen(0);
        this.minihullPort = this.minihull.server.address().port;
        this.hullConnector = this.setupTestConnector();
        this.hullConnector.setupApp(this.app);
        this.server(this.app);
        this.hullConnectorServer = await this.hullConnector.startApp(this.app);

        if (this.worker) {
          this.worker(this.hullConnector);
          this.hullConnector.startWorker();
        }

        this.hullConnectorPort = this.hullConnectorServer.address().port;
        this.scenarioDefinition = this.rawScenarioDefinition({
          expect,
          nock,
          handlers,
          connectorPort: this.hullConnectorPort,
          minihullPort: this.minihullPort,
          alterFixture: (fixture, modification) => {
            // $FlowFixMe
            return _.defaultsDeep({}, modification, fixture); // eslint-disable-line global-require, import/no-dynamic-require
          }
        });
        this.nockScope =
          this.scenarioDefinition.externalApiMock &&
          this.scenarioDefinition.externalApiMock();
        if (this.nockScope) {
          this.nockScope.on("request", req => {
            console.log(">>> NOCK REQUEST", req.path);
          });
          this.nockScope.on("replied", req => {
            console.log(">>> NOCK", req.path);
          });
          this.nockScope.on("replied", this.deboucedFinish);
        }
        this.server = this.scenarioDefinition.connectorServer;
        this.connector = _.defaults(this.scenarioDefinition.connector, {
          id: "9993743b22d60dd829001999",
          private_settings: {},
          manifest: this.connectorManifest
        });
        this.externalIncomingRequest = this.scenarioDefinition.externalIncomingRequest;

        this.minihull.stubConnector(this.connector);
        this.minihull.stubUsersSegments(this.scenarioDefinition.usersSegments);
        this.minihull.stubAccountsSegments(
          this.scenarioDefinition.accountsSegments
        );
        let response;
        const { handlerUrl, channel } = this.scenarioDefinition;
        switch (this.scenarioDefinition.handlerType) {
          case handlers.scheduleHandler:
          case handlers.jsonHandler:
            response = await this.minihull.postConnector(
              this.connector,
              `http://localhost:${this.hullConnectorPort}/${handlerUrl}`,
              this.scenarioDefinition.usersSegments,
              this.scenarioDefinition.accountsSegments
            );
            break;
          case handlers.incomingRequestHandler:
            response = await this.externalIncomingRequest({
              superagent,
              connectorUrl: `http://localhost:${this.hullConnectorPort}`,
              plainCredentials: {
                organization: this.minihull._getOrgAddr(),
                ship: this.connector.id,
                secret: this.minihull.secret
              }
            });
            break;
          case handlers.batchHandler:
            if (channel === "user:update") {
              this.minihull.stubUsersBatch(this.scenarioDefinition.messages);
              response = await this.minihull.batchUsersConnector(
                this.connector,
                `http://localhost:${this.hullConnectorPort}/${handlerUrl}`,
                this.scenarioDefinition.usersSegments,
                this.scenarioDefinition.accountsSegments
              );
            } else {
              this.minihull.stubAccountsBatch(this.scenarioDefinition.messages);
              response = await this.minihull.batchAccountsConnector(
                this.connector,
                `http://localhost:${this.hullConnectorPort}/${handlerUrl}`,
                this.scenarioDefinition.usersSegments,
                this.scenarioDefinition.accountsSegments
              );
            }
            break;
          case handlers.notificationHandler:
            response = await this.minihull.notifyConnector(
              this.connector,
              `http://localhost:${this.hullConnectorPort}/${handlerUrl}`,
              channel,
              this.scenarioDefinition.messages,
              this.scenarioDefinition.usersSegments,
              this.scenarioDefinition.accountsSegments
            );
            break;
          case undefined:
            throw new Error("Wrong handlerType");
          default:
            throw new Error(
              `Wrong handlerType: ${this.scenarioDefinition.handlerType.name}`
            );
        }
        debug("response", response.body, response.statusCode);
        expect(response.body).toEqual(this.scenarioDefinition.response);
        expect(response.statusCode).toEqual(
          this.scenarioDefinition.responseStatusCode || 200
        );
        this.timeoutId = setTimeout(() => {
          this.deboucedFinish.cancel();
          throw new Error("Scenario timeouted");
        }, this.timeout);
        this.deboucedFinish();
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }

  setupTestConnector() {
    const options = {
      port: 0,
      hostSecret: "1234",
      skipSignatureValidation: true,
      clientConfig: {
        protocol: "http",
        firehoseUrl: `http://localhost:${this.minihullPort}/api/v1/firehose`,
        flushAt: 1,
        flushAfter: 1
      },
      captureMetrics: this.capturedMetrics,
      captureLogs: this.capturedLogs,
      disableOnExit: true
    };

    const connector = new Hull.Connector(options);

    return connector;
  }
}

module.exports = TestScenarioRunner;
