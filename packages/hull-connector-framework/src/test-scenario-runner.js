// @flow
const _ = require("lodash");
const Hull = require("hull");
const handlers = require("hull/src/handlers");
const Minihull = require("minihull");
const nock = require("nock");
const express = require("express");
const jwt = require("jwt-simple");
const expect = require("expect");
const { EventEmitter } = require("events");

export type TestScenarioDefinition = Object => {
  connectorServer: express => express,
  handlerType: $Values<typeof handlers>,
  handlerName: string,
  connector: Object,
  usersSegments: Array<*>,
  accountsSegments: Array<*>,
  externalApiMock: Function,
  firehoseEvents: Array<*>,
  response: any,
  metrics: Array<*>,
  logs: Array<*>
};

class TestScenarioRunner extends EventEmitter {
  minihull: typeof Minihull;

  nockScope: *;

  app: *;

  hullConnector: *;

  scenarioDefinition: *;

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

  constructor(scenarioDefinition: TestScenarioDefinition) {
    super();
    expect.extend({
      whatever() {
        return {
          pass: true,
          message: ""
        };
      }
    });

    this.finished = false;
    // this.hullConnectorPort = 9091;
    // this.minihullPort = 9092;
    this.timeout = 10000;
    this.debounceWait = 100;
    this.capturedMetrics = [];
    this.capturedLogs = [];
    this.scenarioDefinition = scenarioDefinition({ expect, nock, handlers });
    this.minihull = new Minihull();
    this.app = express();
    this.server = this.scenarioDefinition.connectorServer;
    this.connector = _.defaults(this.scenarioDefinition.connector, {
      id: "9993743b22d60dd829001999",
      private_settings: {}
    });
    this.deboucedFinish = _.debounce(() => this.finish(), this.debounceWait, {
      maxWait: this.timeout
    });

    this.minihull.on("incoming.request", req =>
      console.log(">>>> MINIHULL", req.method, req.url)
    );
    this.minihull.on("incoming.request@/api/v1/firehose", this.deboucedFinish);

    this.minihull.stubConnector(this.connector);
    this.minihull.stubUsersSegments(this.scenarioDefinition.usersSegments);
    this.minihull.stubAccountsSegments(
      this.scenarioDefinition.accountsSegments
    );
    this.nockScope = this.scenarioDefinition.externalApiMock();

    switch (this.scenarioDefinition.handlerType) {
      case handlers.scheduleHandler:
      case handlers.jsonHandler:
        break;
      default:
        throw new Error(
          `Wrong handlerType: ${this.scenarioDefinition.handlerType.name}`
        );
    }

    this.nockScope.on("replied", this.deboucedFinish);
  }

  async finish() {
    try {
      if (this.finished === true) {
        throw new Error(
          "Scenario finshed multiple times, try to up `debounceWait` parameter"
        );
      }
      clearTimeout(this.timeoutId);
      this.finished = true;

      expect(
        this.capturedMetrics.map(metric => {
          return [metric[0], metric[1], metric[2]];
        })
      ).toMatchObject(this.scenarioDefinition.metrics);
      const transformedLogs = this.capturedLogs.map(log => {
        return [
          log.level,
          log.message,
          _.omit(log.context, "organization", "id", "connector_name"),
          log.data
        ];
      });
      expect(transformedLogs).toMatchObject(this.scenarioDefinition.logs);
      // transformedLogs.forEach((log, index) => {
      //   expect(log).toMatchObject(this.scenarioDefinition.logs[index]);
      // });

      // expect(this.capturedLogs.map(log => {
      //   return [log.level, log.message, _.omit(log.context, "organization", "id", "connector_name"), log.data];
      // })).toMatchObject(this.scenarioDefinition.logs);
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
      expect(firehoseEvents).toMatchObject(
        this.scenarioDefinition.firehoseEvents
      );
      if (!this.nockScope.isDone()) {
        throw new Error(
          `pending mocks: ${JSON.stringify(this.nockScope.pendingMocks())}`
        );
      }
      nock.cleanAll();
      nock.enableNetConnect();
      await this.minihull.close();
      await new Promise(resolve => {
        this.hullConnectorServer.close(() => resolve());
      });
    } catch (error) {
      return this.emit("error", error);
    }
    return this.emit("finish");
  }

  async run() {
    return new Promise(async (resolve, reject) => {
      nock.disableNetConnect();
      nock.enableNetConnect("localhost");
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

      this.hullConnectorPort = this.hullConnectorServer.address().port;

      const { handlerName } = this.scenarioDefinition;
      const response = await this.minihull.postConnector(
        this.connector,
        `http://localhost:${this.hullConnectorPort}/${handlerName}`,
        this.scenarioDefinition.usersSegments,
        this.scenarioDefinition.accountsSegments
      );
      expect(response.body).toMatchObject(this.scenarioDefinition.response);
      expect(response.statusCode).toEqual(200);
      this.timeoutId = setTimeout(() => {
        this.deboucedFinish.cancel();
        throw new Error("Scenario timeouted");
      }, this.timeout);
    });
  }

  setupTestConnector() {
    Hull.Client.logger.transports.console.level = "debug";
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
