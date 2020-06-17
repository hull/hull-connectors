/* @flow */
import type { ILogger, IMetricsClient } from "../../server/lib/types";

class LoggerMock implements ILogger {
  debug(message: any, ...optionalParams: any[]): void { // eslint-disable-line class-methods-use-this
    console.debug(message, optionalParams);
  }

  log(message: any, ...optionalParams: any[]): void { // eslint-disable-line class-methods-use-this
    console.log(message, optionalParams);
  }

  error(message: any, ...optionalParams: any[]): void { // eslint-disable-line class-methods-use-this
    console.error(message, optionalParams);
  }

  info(message: any, ...optionalParams: any[]): void { // eslint-disable-line class-methods-use-this
    console.info(message, optionalParams);
  }

  warn(message: any, ...optionalParams: any[]): void { // eslint-disable-line class-methods-use-this
    console.warn(message, optionalParams);
  }
}

class MetricsClientMock implements IMetricsClient {
  increment(name: string, value: number = 1) { // eslint-disable-line class-methods-use-this
    console.log(`Metric ${name} incremented by ${value}`);
  }

  value(name: string, value: number = 1) { // eslint-disable-line class-methods-use-this
    console.log(`Metric ${name} value set to ${value}`);
  }
}

module.exports = { LoggerMock, MetricsClientMock };
