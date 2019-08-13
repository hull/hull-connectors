/* @flow */
import type { $Application } from "express";

import type {
  HullContext,
  HullRequest,
  HullAccountUpdateMessage,
  HullUserUpdateMessage
} from "hull";

const {
  HullOutgoingAccount,
  HullOutgoingUser
} = require("./hull-service-objects");

const { isUndefinedOrNull, toSendMessage } = require("./utils");

const { oAuthHandler } = require("hull/src/handlers");

const { HullDispatcher } = require("./dispatcher");
const { hullService } = require("./hull-service");

const { hubspotoauth } = require("./auth/hubspot-oauth");
const { oauth2 } = require("./auth/oauth2");
const cors = require("cors");

const {
  notificationHandler,
  jsonHandler,
  scheduleHandler,
  batchHandler,
  incomingRequestHandler,
  htmlHandler
} = require("hull/src/handlers");

const {
  TransientError
} = require("hull/src/errors");

const autoBind = require('auto-bind');

const _ = require("lodash");

class HullRouter {

  manifest: any;
  glue: Object;
  serviceDefinitions: Object;
  transforms: Array<any>;
  ensureHook: string;

  constructor({ manifest, glue, serviceDefinitions, transforms, ensureHook }: any) {
    this.manifest = manifest;
    this.glue = glue;

    // don't assign hull service if it alreay exists...
    this.serviceDefinitions = serviceDefinitions.hull ? serviceDefinitions : _.assign({ hull: hullService }, serviceDefinitions);
    this.transforms = transforms;
    this.ensureHook = ensureHook;

    // This ensures that when we pass method pointers for this object
    // that we have the context of this particular object
    autoBind(this);
  }

  provisionServer(app: $Application) {

    const smartNotifierSubscriptions = _.filter(this.manifest.subscriptions, { url: "/smart-notifier"});

    if (smartNotifierSubscriptions.length > 0) {

      const smartNotifierSubscription = smartNotifierSubscriptions[0];

      // TODO read manifest and create server from the manifest
      const notifications = {};

      const conditions = smartNotifierSubscription.conditions;

      if (!conditions || _.indexOf(conditions.channels.only, "user:update") >= 0) {
        notifications["user:update"] = this.outgoingUserData;
      }

      if (!conditions || _.indexOf(conditions.channels.only, "account:update") >= 0) {
        notifications["account:update"] = this.outgoingAccountData;
      }

      if (!conditions || _.indexOf(conditions.channels.only, "ship:update") >= 0) {
        notifications["ship:update"] = this.shipUpdate;
      }

      if (!_.isEmpty(notifications)) {
        app.post("/smart-notifier", notificationHandler(notifications));
      }
    }

    if (_.indexOf(this.manifest.tags, "batch") >= 0) {
      app.post("/batch", batchHandler({ "user:update": this.outgoingUserData }));
    }

    if (_.indexOf(this.manifest.tags, "batch-accounts") >= 0) {
      app.post("/batch-accounts", batchHandler({ "account:update": this.outgoingAccountData }));
    }

    const schedules = _.get(this.manifest, "schedules", []);
    _.forEach(schedules, schedule => {

      if (!schedule.url)
        return;

      if (schedule.url === "/status") {
        app.post(schedule.url, scheduleHandler(this.createStatusCallback()));
      } else {
        app.post(schedule.url,
          scheduleHandler({
            callback: this.createCallback(schedule.url),
            options: {
              fireAndForget: true
            }
          }));
      }

    });

    this.provisionLoadOptions(app, this.manifest.private_settings);

  }

  provisionLoadOptions(app: $Application, settings: Object) {
    _.forEach(settings, (value, key) => {
      if (key === "loadOptions") {
        const glueCommand = _.camelCase(value);
        app.get(
          value,
          cors(),
          jsonHandler(this.createDispatchCall(glueCommand))
        );
      } else if (Object.keys(value).length > 1) {
        this.provisionLoadOptions(app, value);
      }
    })
  }

  dispatcher(): HullDispatcher {
    return new HullDispatcher(this.glue, this.serviceDefinitions, this.transforms, this.ensureHook);
  }

  /******************* this one isn't declared in manifest *******************/
  createAuthHandler() {
    const primaryService = _.find(this.serviceDefinitions, (service) => {
        return !_.isEmpty(service.authentication)
      });

    if (!isUndefinedOrNull(primaryService)) {
      const authentication = primaryService.authentication;

      if (authentication.strategy === "oauth2") {
        const params = _.cloneDeep(authentication.params);
        _.merge(params, oauth2);
        return oAuthHandler(params);
      } else if (authentication.strategy === "hubspotoauth") {
        const params = _.cloneDeep(authentication.params);
        _.merge(params, hubspotoauth);
        return oAuthHandler(params);
      }
    }
    return null;
  }

  incomingData(route: string, context: HullContext, data: any, type: any) {

    // ask stephane if we need this....
    // will generate a lot of traffic for all webhooks...
    // context.client.logger.info("incoming.job.start", {
    //   jobName: "Incoming Data", type: dataType
    // });
    //Interesting abstraction problem
    // need to tell what type of data is incoming, but the data incoming will be different per connector
    // so there's an idea that needs to be abstracted above]
    const dispatcher: HullDispatcher = this.dispatcher();
    return dispatcher
    .dispatchWithData(context, route, type, data.body)
    .then(results => {
      dispatcher.close();
      return Promise.resolve({ status: 200, text: "All good" });
    }).catch(error => {
      dispatcher.close();
      context.client.logger.error("incoming.job.error", {
        jobName: "Incoming Data", error: error.message
      });
      return Promise.reject(error);
    });
  }

  shipUpdate(context: HullContext) {
    return this.update(context, "shipUpdateStart");
  }

  createCallback(route: string) {
    return (ctx) => {
      return this.update(ctx, _.camelCase(route));
    }
  }

  createDispatchCall(command: string) {
    return (context) =>  {
      const dispatcher: HullDispatcher = this.dispatcher();
      return dispatcher
        .dispatchWithData(context, command)
        .then((results) => {
          dispatcher.close();
          return Promise.resolve(results);
        }).catch(err => {
          dispatcher.close();
          return Promise.reject(err);
        });
    }
  }

// -1 is (status1 < status2)
// 0 is (status1 === status2)
// 1 is (status1 > status1)
  compareStatus(status1: string, status2: string) {
    const statusHierarchy = ["ok", "warning", "error"];

    if (status1 === status2) return 0;

    if (statusHierarchy.indexOf(status1) < statusHierarchy.indexOf(status2)) {
      return -1;
    }

    return 1;
  }

  createStatusCallback() {
    return (ctx) => {
      const dispatcher: HullDispatcher = this.dispatcher();
      return dispatcher.dispatchWithData(ctx, "status")
        .then((messages) => {
          dispatcher.close();
          const flattenedMessages = _.flatten(messages);
          let worstStatus = "ok";
          let messagesToSend = [];
          _.forEach(flattenedMessages, message => {
            if (!message.status || !message.message)
              return;

            const statusComparison = this.compareStatus(worstStatus, message.status);
            if (statusComparison === 0) {
              messagesToSend.push(message.message);
            } else if (statusComparison < 0) {
              messagesToSend = [message.message];
              worstStatus = message.status;
            }
          });

          const statusResults = { status: worstStatus, messages: messagesToSend };
          return ctx.client.put(`${ctx.connector.id}/status`, statusResults)
            .then(() => {
              return Promise.resolve(statusResults);
            });
        }).catch(err => {
          dispatcher.close();

          // TODO not sure what to do here, but this is getting ugly...
          // don't send it back to the status endpoint for now
          // may want to add some fancier logic which looks at how long it's been since the previous status update
          // and then maybe fires the error
          if (err instanceof TransientError) {
            return Promise.resolve({ status: "warning", messages: [err.message]});
          }
          const statusResults = { status: "error", messages: [err.message]};
          return ctx.client.put(`${ctx.connector.id}/status`, statusResults)
            .then(() => {
              return Promise.resolve(statusResults);
            });
        })
    }
  }


  update(context: HullContext, command: string) {
    const dispatcher: HullDispatcher = this.dispatcher();
    return dispatcher
      .dispatchWithData(context, command)
      .then(() => {
        dispatcher.close();
        return Promise.resolve({ status: 200, text: "All good" });
      })
      .catch(error => {
        dispatcher.close();
        context.client.logger.error("outgoing.update.error", {
          jobName: command,
          error: error.message
        });
        return Promise.reject(error);
      });
  }

  outgoingUserData(context: HullContext, messages: Array<HullUserUpdateMessage>) {
    return this.outgoingData("user", context, messages);
  }

  outgoingAccountData(context: HullContext, messages: Array<HullAccountUpdateMessage>) {
    return this.outgoingData("account", context, messages);
  }

  outgoingData(dataType: "account" | "user", context: HullContext, messages: Array<HullUserUpdateMessage> | Array<HullAccountUpdateMessage>) {

    context.client.logger.info("outgoing.job.start", {
      jobName: "Outgoing Data", type: dataType
    });

    const dispatcher: HullDispatcher = this.dispatcher();

    let classType;
    if (dataType === "account") {
      classType = HullOutgoingAccount;
    } else {
      classType = HullOutgoingUser;
    }

    // TODO this whole section must be abstracted HORRIBLE
    // for filtering types as well as to send all messages to endpoint, or 1 by one
    let promise;

    // TODO I don't think datawarehouse needs this anymore
    // at the end, still just fanning out and doing individual inserts...
    // as long as doing everything in the ensure hook (only executed 1x per dispatcher), should be fine to take this out
    // and send messages down 1 by 1
    if (context.connector.manifest.name === "Warehouse" || context.connector.manifest.name === "Marketo") {
      const messagesToSend = _.filter(messages, message => {
        return toSendMessage(context, dataType, message);
      });
      if (messagesToSend.length > 0) {
        promise = dispatcher.dispatchWithData(context, `${dataType}UpdateStart`, classType, messagesToSend);
      } else {
        promise = Promise.resolve();
      }

    } else {
      promise = Promise.all(messages.map(message => {
        const sendMessage = toSendMessage(context, dataType, message);
        if (sendMessage) {
          return dispatcher.dispatchWithData(context, `${dataType}UpdateStart`, classType, message);
        } else {

          if (dataType === 'user' && message.changes && message.changes.is_new) {
            if (_.isEmpty(message.user.email)
              && _.get(message.user, "outreach/created_by_webhook") === true
              && _.get(message.user, "outreach/id")) {
              return dispatcher.dispatchWithData(context, "getProspectById", classType, message);
            }
          }

          return Promise.resolve();
        }
      }));
    }

    return promise.then(results => {
      dispatcher.close();
      context.client.logger.info("outgoing.job.success", {
        jobName: "Outgoing Data", type: dataType
      });
      return Promise.resolve(results);
    }).catch(error => {
      dispatcher.close();
      context.client.logger.error("outgoing.job.error", {
        jobName: "Outgoing Data", error: error.message
      });
      return Promise.reject(error);
    });
  }

  incomingRequest(route: string, request: HullRequest) {

    request.client.logger.info("incoming.job.start", {
      jobName: "Incoming Data Request"
    });

    const dispatcher: HullDispatcher = this.dispatcher();
    return dispatcher.dispatch(request, route).then(results => {
      dispatcher.close();
      request.client.logger.info("incoming.job.success", {
        jobName: "Incoming Data Request"
      });
      return Promise.resolve(results);
    }).catch(error => {
      dispatcher.close();

      let message = "Unknown Error";
      if (error && error.message) {
        message = error.message;
      }
      request.client.logger.error("incoming.job.error", {
        jobName: "Incoming Data Request", error: message
      });
      return Promise.reject(error);
    });
  }

}

module.exports = {
  HullRouter
};
