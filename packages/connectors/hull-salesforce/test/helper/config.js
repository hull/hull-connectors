/* @flow */
import type { IEnvironmentConfig, TSalesforceLogLevel } from "./testenv";

const _ = require("lodash");

class EnvConfig implements IEnvironmentConfig {
  loginUrl: string;
  logLevel: TSalesforceLogLevel;
  username: string;
  password: string;
  hullLogger: boolean;

  constructor() {
    this.loginUrl = _.toString(process.env.SF_LOGINURL);
    // $FlowFixMe: Ignore the enum error
    this.logLevel = process.env.SF_LOGLEVEL ? _.toString(process.env.SF_LOGLEVEL) : "DEBUG"; // eslint-disable-line
    this.username = _.toString(process.env.SF_USERNAME);
    this.password = _.toString(process.env.SF_PASSWORD);
    this.hullLogger = (process.env.SF_HULL_LOGGER === "true");
  }

  isTestEnvironmentConfigured(): boolean {
    if (_.isNil(this.loginUrl) ||
        _.isEmpty(this.loginUrl) ||
        _.isNil(this.logLevel) ||
        _.isEmpty(this.logLevel) ||
        _.isNil(this.username) ||
        _.isEmpty(this.username) ||
        _.isNil(this.password) ||
        _.isEmpty(this.password)) {
      return false;
    }

    return true;
  }
}

module.exports = EnvConfig;
