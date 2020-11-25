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
const { getEntityTriggers } = require("./triggers/trigger-utils");

const { hullService } = require("./hull-service");

const { toSendMessage, isUndefinedOrNull } = require("./utils");
const { statusCallback, statusErrorCallback, resolveServiceDefinition } = require("./router-utils");
const { getServiceOAuthParams } = require("./auth/auth-utils");

class HullRouter {

  glue: Object;
  serviceDefinitions: Object;
  transforms: Array<any>;
  ensureHook: string;
  serviceName: string;
  filteredMessageCallback: Function;

  constructor({ serviceName, glue, services, transforms, ensureHook }: any, filteredMessageCallback?: Function) {
    this.serviceName = serviceName;
    this.glue = glue;

    // don't assign hull service if it already exists...
    this.serviceDefinitions = services.hull ? services : _.assign({ hull: hullService }, services);
    this.transforms = transforms;
    this.ensureHook = ensureHook;
    this.filteredMessageCallback = filteredMessageCallback;

    // This ensures that when we pass method pointers for this object
    // that we have the context of this particular object
    autoBind(this);
  }

  dispatcher(): HullDispatcher {
    return new HullDispatcher(this.glue, this.serviceDefinitions, this.transforms, this.ensureHook);
  }

  createHandler(hullConnector: any) {
    // This seems like it's very circular logic...
    // I don't like having to declare the handler in the manifest, seems like it should be implicit
    // but I'll use the existing pattern
    // At least it only has to be written once
    const manifest = hullConnector.manifest;
    const handlers = {};

    _.forEach(_.get(manifest, "subscriptions", []), endpoint => {
      _.forEach(_.get(endpoint, "channels", []), channel => {
        _.set(handlers, `subscriptions.${channel.handler}`, this.createOutgoingDispatchCallback(channel));
      });
    });

    _.forEach(_.get(manifest, "batches", []), endpoint => {
      _.forEach(_.get(endpoint, "channels", []), channel => {
        _.set(handlers, `batches.${channel.handler}`, this.createOutgoingDispatchCallback(channel));
      });
    });

    _.forEach(_.get(manifest, "statuses", []), endpoint => {
      _.set(handlers, `statuses.${endpoint.handler}`, this.createIncomingDispatchCallback(endpoint, statusCallback, statusErrorCallback));
    });

    _.forEach(_.get(manifest, "schedules", []), endpoint => {
      _.set(handlers, `schedules.${endpoint.handler}`, this.createIncomingDispatchCallback(endpoint));
    });

    _.forEach(_.get(manifest, "tabs", []), endpoint => {
      _.set(handlers, `tabs.${endpoint.handler}`, this.createIncomingDispatchCallback(endpoint));
    });

    _.forEach(_.get(manifest, "json", []), endpoint => {
      _.set(handlers, `json.${endpoint.handler}`, this.createIncomingDispatchCallback(endpoint));
    });

    _.forEach(_.get(manifest, "incoming", []), endpoint => {
      _.set(handlers, `incoming.${endpoint.handler}`, this.createIncomingDispatchCallback(endpoint));
    });

    _.set(handlers, "private_settings.oauth", () => getServiceOAuthParams(manifest, this.serviceDefinitions));

    // mapNotification(notificationHandler, "subscriptions");
    // mapNotification(batchHandler, "batches");
    // mapRoute(statusHandler, "statuses", "all", this.manifest.statuses);
    // mapRoute(scheduleHandler, "schedules", "all", this.manifest.schedules);
    // mapRoute(htmlHandler, "tabs", "all", this.manifest.tabs);
    return handlers;
  }

  createOutgoingDispatchCallback(endpoint: string, callback?: Function, errorCallback?: Function) {
    return this.createDispatchCallback("outgoing", endpoint, callback, errorCallback);
  }
  createIncomingDispatchCallback(endpoint: string, callback?: Function, errorCallback?: Function) {
    return this.createDispatchCallback("incoming", endpoint, callback, errorCallback);
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

      context.client.logger.info(`${_.toLower(direction)}.job.start`, {
        jobName: `${_.upperFirst(direction)} Data`,
        type: _.toLower(objectType.name)
      });

      const connectorOptions = _.get(context, "connectorConfig.options", {});
      const isTrigger = _.get(connectorOptions, "outgoingMechanism", "sync") === "trigger" && direction === "outgoing";

      if (isTrigger && (objectType === HullOutgoingUser || objectType === HullOutgoingAccount)) {
        return this.dispatchTrigger(context, dispatcher, objectType, data);
      }

      let dataToSend;
      let leadDataToSend = [];
      let dataToSkip = [];

      if (Array.isArray(data) && (objectType === HullOutgoingUser || objectType === HullOutgoingAccount)) {

        let entityType = _.toLower(objectType.name);

        dataToSend = [];
        // break up data and send one by one
        _.forEach(data, message => {
          if (toSendMessage(context, entityType, message, { serviceName: this.serviceName })) {
            dataToSend.push(message);
          } else {
            dataToSkip.push(message);
          }
        });

        // Right now this logic isn't quite right.  For batch scenarios, we'll default to sending leads if the user
        // isn't in any segment.  This is ok for now, but ask product in the future if we want to change
        // salesforce connector doesn't send at all if user is in neither segment, which might be ok
        // we would have to extract the "send regardless" logic out to here, but that's probably where it belongs anyway
        if (entityType === "user") {
          if (!isUndefinedOrNull(_.get(context, "connector.private_settings.synchronized_lead_segments"))) {
            _.forEach(data, message => {
              if (toSendMessage(context, "lead", message, { serviceName: this.serviceName })) {
                leadDataToSend.push(message);
              }
            });

            // TODO current prefer to send leads, so remove from being sent as a user
            // not sure if this is always right, but it's the behavior of other connectors right now
            dataToSend = _.difference(dataToSend, leadDataToSend);
            dataToSkip = _.difference(dataToSkip, leadDataToSend);
          }
        }

      } else {
        dataToSend = data;
      }


      // I like getting rid of the splitting here, and always passing in the data
      // glue can handle the split if needed
      // TODO need to test sending an empty array, or decide if we need extra logic here...
      let dispatchPromise = dispatcher.dispatchWithData(context, route, objectType, dataToSend);

      if (!_.isEmpty(leadDataToSend)) {
        dispatchPromise = dispatchPromise.then((results) => {
          return dispatcher.dispatchWithData(context, "leadUpdate", objectType, leadDataToSend);
        });
      }

      if (this.filteredMessageCallback) {
        dispatchPromise = this.filteredMessageCallback(context, dispatcher, dispatchPromise, objectType, dataToSkip);
      }

      return dispatchPromise
        .then(results => {
          dispatcher.close();

          context.client.logger.info(`${_.toLower(direction)}.job.success`, {
            jobName: `${_.upperFirst(direction)} Data`,
            type: _.toLower(objectType.name)
          });
          if (callback) {
            // TODO make sure this works if callback returns promise
            return Promise.resolve(callback(context, results))
          }

          return Promise.resolve(results);
        }).catch(error => {
          dispatcher.close();

          if (errorCallback) {
            // TODO make sure this works if callback returns promise
            return Promise.resolve(errorCallback(context, error))
          }

          context.client.logger.error(`${_.toLower(direction)}.job.error`, {
            jobName: `${_.upperFirst(direction)} Data`,
            error: error.message,
            type: _.toLower(objectType.name)
          });
          return Promise.reject(error);
        });
    };
  }

  dispatchTrigger(context: Object, dispatcher: HullDispatcher, objectType: ServiceObjectDefinition, data: Object) {

    let triggerPromises = [];

    const dataToSend = Array.isArray(data) ? data : [data];
    _.forEach(dataToSend, message => {

      const triggers = getEntityTriggers(message, context.connector.private_settings.triggers);

      _.forEach(triggers, (trigger) => {
        triggerPromises.push(dispatcher.dispatchWithData(context, "performTrigger", objectType, [ trigger ]));
      });
    });

    return Promise.all(triggerPromises)
      .then(results => {
        dispatcher.close();

        context.client.logger.info("outgoing.job.success", {
          jobName: "Outgoing Data",
          type: _.toLower(objectType.name)
        });
        return Promise.resolve(results);
      }).catch(error => {
        dispatcher.close();

        context.client.logger.error("outgoing.job.error", {
          jobName: "Outgoing Data",
          error: error.message,
          type: _.toLower(objectType.name)
        });
        return Promise.reject(error);
      });
  }
}

module.exports = HullRouter;
