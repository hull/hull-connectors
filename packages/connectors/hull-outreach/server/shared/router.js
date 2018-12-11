/* @flow */
import type {
  HullContext,
  HullRequest,
  HullAccountUpdateMessage,
  HullUserUpdateMessage
} from "hull";

const {
  WebhookPayload
} = require("../service-objects");

const {
  HullOutgoingAccount,
  HullOutgoingUser
} = require("./hull-service-objects");

const { isUndefinedOrNull, toSendMessage } = require("./utils");

const { oAuthHandler } = require("hull/src/handlers");

const { HullDispatcher } = require("./dispatcher");
const { hullService } = require("./hull-service");

const { oauth2 } = require("./auth/oauth2");

const { glue } = require("../glue");
const { service } = require("../service");
const { transformsToService } = require("../transforms-to-service");
const { transformsToHull } = require("../transforms-to-hull");
const _ = require("lodash");

const MESSAGES = require("../messages");

class HullRouter {

  glue: Object;
  serviceDefinitions: Object;
  transforms: Array<any>;
  ensureHook: string;

  constructor() {
      this.glue = glue;
      this.serviceDefinitions = { hull: hullService, outreach: service};
      this.transforms = _.concat(transformsToHull, transformsToService);

      // TODO put this as part of the service?
      // only executed before a call to the service?
      this.ensureHook = "ensureWebhooks";
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
      }
    }
    return null;
  }

  /******************* this one isn't declared in manifest *******************/
  fetchAll(context: HullContext) {
    this.dispatcher().dispatch(context, "fetchAll");
    return Promise.resolve("ok");
  }

  accountFetchAll(context: HullContext) {
    this.dispatcher().dispatch(context, "accountFetchAll");
    return Promise.resolve("ok");
  }

  prospectFetchAll(context: HullContext) {
    this.dispatcher().dispatch(context, "prospectFetchAll");
    return Promise.resolve("ok");
  }

    /******************* this one isn't declared in manifest *******************/
  webhook(context: HullContext, webhookPayload: any) {
    // Interesting abstraction problem
    // need to tell what type of data is incoming, but the data incoming will be different per connector
    // so there's an idea that needs to be abstracted above
    this.dispatcher().dispatchWithData(context, "webhook", WebhookPayload, webhookPayload.body);
    return Promise.resolve({ status: 200, text: "All good" });
  }

  status(req: HullRequest): Promise<any> {
    const { connector, client } = req;
    let status: string = "ok";
    const messages: Array<string> = [];

    if (_.has(req, "connector.private_settings")) {
      // changing this to an else if block so that we don't bombard the customers with different messages
      // want to be clear with them the thing they need to do next
      if (!_.has(connector, "private_settings.access_token")) {
        status = "error";
        messages.push(MESSAGES.STATUS_NO_ACCESS_TOKEN_FOUND().message);
      } else if (
        _.isEmpty(
          _.get(connector, "private_settings.synchronized_account_segments", [])
        ) &&
        _.isEmpty(
          _.get(connector, "private_settings.synchronized_user_segments", [])
        )
      ) {
        status = "warning";
        messages.push(MESSAGES.STATUS_WARNING_NOSEGMENTS().message);
      }
    } else {
      status = "error";
      messages.push(
        MESSAGES.STATUS_CONNECTOR_MIDDLEWARE_MISCONFIGURED().message
      );
    }

    return client.put(`${connector.id}/status`, { status, messages }).then(() => {
      return { status, messages };
    });
  }

  userUpdate(context: HullContext, messages: Array<HullUserUpdateMessage>): Promise<any> {
    const dispatcher: HullDispatcher = this.dispatcher();

    const promise = Promise.all(messages.map(message => {

      const sendMessage = toSendMessage(context, "user", message);
      // TODO send "link account" var in?
      if (sendMessage) {
        return dispatcher.dispatchWithData(context, "userUpdateStart", HullOutgoingUser, message);
      } else {
        return Promise.resolve();
      }
    }));
    return promise;
   }


  accountUpdate(context: HullContext, messages: Array<HullAccountUpdateMessage>): Promise<any>  {

    const dispatcher: HullDispatcher = this.dispatcher();
    const promise = Promise.all(messages.map(message => {
      const sendMessage = toSendMessage(context, "account", message);
      if (sendMessage) {
        return dispatcher.dispatchWithData(context, "accountUpdateStart", HullOutgoingAccount, message);
      } else {
        return Promise.resolve();
      }
    }));
     return promise;
  }

}

module.exports = {
  HullRouter
};
