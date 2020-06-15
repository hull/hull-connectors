/* @flow */
const Promise = require("bluebird");
const Hull = require("hull");
const Connection = require("../../server/lib/service-client/connection");

export type TSalesforceLogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface IEnvironmentConfig {
  loginUrl: string,
  logLevel: TSalesforceLogLevel,
  username: string,
  password: string,
  isTestEnvironmentConfigured(): boolean
}

function createConnection(loginUrl: string, logLevel: TSalesforceLogLevel): Connection {
  return new Connection({ loginUrl, logLevel });
}

class TestEnv {
  config: IEnvironmentConfig;
  connection: any;
  /**
   * Creates an instance of TestEnv.
   * @param {EnvironmentConfig} config The configuration for the test environment.
   * @memberof TestEnv
   */
  constructor(config: IEnvironmentConfig) {
    this.config = config;
    this.connection = createConnection(config.loginUrl, config.logLevel);
    // $FlowFixMe: Ignore it because this is just for testing purposes
    if (config.hullLogger) { // eslint-disable-line
      Hull.logger.transports.console.level = "debug";
      const client = new Hull({
        id: "123456789012345678901234",
        secret: "1234",
        organization: "1234"
      });
      this.connection.setLogger(client.logger);
    }
  }

  establishConnection(): Promise {
    return this.connection.login(this.config.username, this.config.password);
  }

  closeConnection(): Promise<void> {
    return this.connection.logout();
  }

  isConfigured(): boolean {
    return this.config.isTestEnvironmentConfigured();
  }
}

module.exports = TestEnv;
