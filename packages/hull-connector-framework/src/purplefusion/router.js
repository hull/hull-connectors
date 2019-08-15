/* @flow */

import type { ServiceObjectDefinition } from "./types";

const _ = require("lodash");
const autoBind = require('auto-bind');

const {
  LogicError
} = require("hull/src/errors");

const {
  HullOutgoingAccount,
  HullOutgoingUser
} = require("./hull-service-objects");

const { HullDispatcher } = require("./dispatcher");

const { hullService } = require("./hull-service");

const { toSendMessage } = require("./utils");
const { statusCallback, statusErrorCallback, resolveServiceDefinition } = require("./service-utils");
const { createAuthHandler } = require("./auth/auth-utils");

class HullRouter {

  glue: Object;
  serviceDefinitions: Object;
  transforms: Array<any>;
  ensureHook: string;

  constructor({ glue, serviceDefinitions, transforms, ensureHook }: any) {
    this.glue = glue;

    // don't assign hull service if it already exists...
    this.serviceDefinitions = serviceDefinitions.hull ? serviceDefinitions : _.assign({ hull: hullService }, serviceDefinitions);
    this.transforms = transforms;
    this.ensureHook = ensureHook;

    // This ensures that when we pass method pointers for this object
    // that we have the context of this particular object
    autoBind(this);
  }

  dispatcher(): HullDispatcher {
    return new HullDispatcher(this.glue, this.serviceDefinitions, this.transforms, this.ensureHook);
  }

  createHandlerFactory(manifest: any) {
    // This seems like it's very circular logic...
    // I don't like having to declare the handler in the manifest, seems like it should be implicit
    // but I'll use the existing pattern
    // At least it only has to be written once

    const handlers = {};

    _.forEach(_.get(manifest, "subscriptions.channels", []), endpoint => {
      handlers[channel.handler] = this.createOutgoingDispatchCallback(endpoint);
    });

    _.forEach(_.get(manifest, "subscriptions.batches", []), endpoint => {
      handlers[channel.handler] = this.createOutgoingDispatchCallback(endpoint);
    });

    _.forEach(_.get(manifest, "statuses", []), endpoint => {
      handlers[channel.handler] = this.createIncomingDispatchCallback(endpoint, statusCallback, statusErrorCallback);
    });

    _.forEach(_.get(manifest, "schedules", []), endpoint => {
      handlers[channel.handler] = this.createIncomingDispatchCallback(endpoint);
    });

    _.forEach(_.get(manifest, "tabs", []), endpoint => {
      handlers[channel.handler] = this.createIncomingDispatchCallback(endpoint);
    });

    _.forEach(_.get(manifest, "json", []), endpoint => {
      handlers[channel.handler] = this.createIncomingDispatchCallback(endpoint);
    });

    _.set(handlers, "private_settings.oauth", createAuthHandler(manifest, this.serviceDefinitions));

    // mapNotification(notificationHandler, "subscriptions");
    // mapNotification(batchHandler, "batches");
    // mapRoute(statusHandler, "statuses", "all", this.manifest.statuses);
    // mapRoute(scheduleHandler, "schedules", "all", this.manifest.schedules);
    // mapRoute(htmlHandler, "tabs", "all", this.manifest.tabs);

  }

  createOutgoingDispatchCallback(endpoint: string, callback?: Function, errorCallback?: Function) {
    return this.createDispatchCallback("outgoing", route, callback, errorCallback);
  }
  createIncomingDispatchCallback(endpoint: string, callback?: Function, errorCallback?: Function) {
    return this.createDispatchCallback("incoming", route, callback, errorCallback);
  }

  createDispatchCallback(direction: string, endpoint: { handler: string, channel?: string }, callback?: Function, errorCallback?: Function) {

    return (context, data) => {

      let route = endpoint.handler;
      if (!this.glue[route]) {
        throw new LogicError(`Error: Entry Route "${route}" not found in the glue!`)
      }

      // not sure if this is the right pattern, but I think it's fair to infer the type of object based the manifest
      const objectType: ServiceObjectDefinition = resolveServiceDefinition(endpoint);
      const dispatcher: HullDispatcher = this.dispatcher();

      context.client.logger.debug(`${_.toLower(direction)}.job.start`, {
        jobName: `${_.upperFirst(direction)} Data`,
        route
      });

      let dataToSend = data;
      const dataToSkip = [];

      if (Array.isArray(dataToSend) && (objectType === HullOutgoingUser || objectType === HullOutgoingAccount)) {
        dataToSend = [];
        // break up data and send one by one
        _.forEach(dataToSend, message => {
          if (toSendMessage(context, objectType, message)) {
            dataToSend.push(message);
          } else {
            dataToSkip.push(message);
          }
        });
      }

      // I like getting rid of the splitting here, and always passing in the data
      // glue can handle the split if needed
      let dispatchPromise = dispatcher.dispatchWithData(context, route, objectType, dataToSend);

      // This is still bad... need to decide how to handle this....
      _.forEach(dataToSkip, dataToSkipElement => {
        if (objectType === HullOutgoingUser && dataToSkipElement.changes && dataToSkipElement.changes.is_new) {
          if (_.isEmpty(_.get(dataToSkipElement, "user.email"))
            && _.get(dataToSkipElement.user, "outreach/created_by_webhook") === true
            && _.get(dataToSkipElement.user, "outreach/id")) {
            dispatchPromise = dispatchPromise.then(() => {
              return dispatcher.dispatchWithData(context, "getProspectById", objectType, dataToSkipElement);
            });
          }
        }
      });

      return dispatchPromise
        .then(results => {
          dispatcher.close();

          if (callback) {
            // TODO make sure this works if callback returns promise
            return Promise.resolve(callback(context, results))
          }

          context.client.logger.info(`${_.toLower(direction)}.job.success`, {
            jobName: `${_.upperFirst(direction)} Data`,
            error: error.message,
            route
          });
          return Promise.resolve(results);
        }).catch(error => {
          dispatcher.close();

          if (errorCallback) {
            // TODO make sure this works if callback returns promise
            return Promise.resolve(callback(context, error))
          }

          context.client.logger.error(`${_.toLower(direction)}.job.error`, {
            jobName: `${_.upperFirst(direction)} Data`,
            error: error.message,
            route
          });
          return Promise.reject(error);
        });
    };
  }


}

module.exports = {
  HullRouter
};
