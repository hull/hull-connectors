/* @flow */
import type {
  HullContext,
  HullRequest,
  HullAccountUpdateMessage,
  HullUserUpdateMessage,
  HullNotificationResponse,
  HullIncomingHandlerMessage,
  HullOAuthHandlerParams
} from "hull";
import service from "../service";
const { WebhookPayload } = require("../service-objects");

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
const { transformsToService } = require("../transforms-to-service");
const { transformsToHull } = require("../transforms-to-hull");
const _ = require("lodash");

const MESSAGES = require("../messages");

class HullRouter {
  glue: Object;

  serviceDefinitions: Object;

  transforms: Array<any>;

  ensureHook: string;

  constructor({
    clientID,
    clientSecret
  }: {
    clientID: string,
    clientSecret: string
  }) {
    this.glue = glue;
    this.serviceDefinitions = { hull: hullService, outreach: service({ clientID, clientSecret }) };
    this.transforms = _.concat(transformsToHull, transformsToService);

    // TODO put this as part of the service?
    // only executed before a call to the service?
    this.ensureHook = "ensureWebhooks";
  }

  dispatcher(): HullDispatcher {
    return new HullDispatcher(
      this.glue,
      this.serviceDefinitions,
      this.transforms,
      this.ensureHook
    );
  }

  /** ***************** this one isn't declared in manifest *******************/
  createAuthHandler = (): HullOAuthHandlerParams => {
    const primaryService = _.find(
      this.serviceDefinitions,
      service => !_.isEmpty(service.authentication)
    );

    if (!isUndefinedOrNull(primaryService)) {
      const authentication = primaryService.authentication;

      if (authentication.strategy === "oauth2") {
        const params = _.cloneDeep(authentication.params);
        _.merge(params, oauth2);
        return params;
        // return oAuthHandler(params);
      }
    }
    return;
  }

  async incomingData(
    route: string,
    context: HullContext,
    { body }: HullIncomingHandlerMessage
  ) {
    // ask stephane if we need this....
    // will generate a lot of traffic for all webhooks...
    // context.client.logger.info("incoming.job.start", {
    //   jobName: "Incoming Data", type: dataType
    // });
    // Interesting abstraction problem
    // need to tell what type of data is incoming, but the data incoming will be different per connector
    // so there's an idea that needs to be abstracted above]

    try {
      const dispatcher: HullDispatcher = this.dispatcher();
      const results = await dispatcher.dispatchWithData(
        context,
        route,
        WebhookPayload,
        body
      );
      dispatcher.close();
      // context.client.logger.info("incoming.job.success", {
      //   jobName: "Incoming Data", type: dataType
      // });
      return { status: 200, text: "All good" };
    } catch (error) {
      context.client.logger.error("incoming.job.error", {
        jobName: "Incoming Data",
        error: error.message
      });
      throw error;
    }
  }

  async outgoingData(
    dataType: "account" | "user",
    context: HullContext,
    messages: Array<HullUserUpdateMessage> | Array<HullAccountUpdateMessage>
  ): HullNotificationResponse {
    context.client.logger.info("outgoing.job.start", {
      jobName: "Outgoing Data",
      type: dataType
    });

    const dispatcher: HullDispatcher = this.dispatcher();

    let classType;
    if (dataType === "account") {
      classType = HullOutgoingAccount;
    } else {
      classType = HullOutgoingUser;
    }

    try {
      const results = await Promise.all(
        messages.map(message => {
          const sendMessage = toSendMessage(context, dataType, message);
          if (sendMessage) {
            return dispatcher.dispatchWithData(
              context,
              `${dataType}UpdateStart`,
              classType,
              message
            );
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
        })
      );
      context.client.logger.info("outgoing.job.success", {
        jobName: "Outgoing Data",
        type: dataType
      });
      return { results };
    } catch (error) {
      dispatcher.close();
      context.client.logger.error("outgoing.job.error", {
        jobName: "Outgoing Data",
        error: error.message
      });
      throw error;
    }
  }

  async incomingRequest(route: string, ctx: HullContext) {
    ctx.client.logger.info("incoming.job.start", {
      jobName: "Incoming Data Request"
    });

    try {
      const dispatcher: HullDispatcher = this.dispatcher();
      const results = await dispatcher.dispatch(ctx, route);
      ctx.client.logger.info("incoming.job.success", {
        jobName: "Incoming Data Request"
      });
      return results;
    } catch (error) {
      ctx.client.logger.error("incoming.job.error", {
        jobName: "Incoming Data Request",
        error: error.message
      });
      return error;
    }
  }

  status(ctx: HullContext): Promise<any> {
    const { connector, client } = ctx;
    let status: string = "ok";
    const messages: Array<string> = [];

    if (_.has(ctx, "connector.private_settings")) {
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

    return client
      .put(`${connector.id}/status`, { status, messages })
      .then(() => {
        return { status, messages };
      });
  }
}

export default HullRouter;
