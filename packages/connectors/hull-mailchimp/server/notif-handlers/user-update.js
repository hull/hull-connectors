/* @flow */
import type { HullContext, HullUserUpdateMessage } from "hull";

const _ = require("lodash");
const promiseRetry = require("promise-retry");
const Promise = require("bluebird");
const { ConfigurationError } = require("hull/src/errors");

const shipAppFactory = require("../lib/ship-app-factory");
const trackUsers = require("../jobs/track-users");

/**
 * Handles notification about user changes
 */
function userUpdateHandler(
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage> = []
) {
  const { syncAgent } = shipAppFactory(ctx);

  ctx.notificationResponse = {
    flow_control: {
      type: "next",
      size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 50,
      in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 10,
      in_time: parseInt(process.env.FLOW_CONTROL_IN_TIME, 10) || 30000
    }
  };

  if (!syncAgent.isConfigured()) {
    ctx.client.logger.error("connector.configuration.error", {
      errors: "connector not configured, skipping user update"
    });
    // uncomment this when we've confirmed this is the correct thing ot do in all cases
    return Promise.resolve();
  }

  const filteredMessages = messages.reduce((accumulator, message) => {
    const { changes = {}, user, events, segments = [] } = message;
    // $FlowFixMe
    ctx.client.asUser(user).logger.debug("outgoing.user.start", {
      changes,
      events: _.map(events, e => e.event),
      segments: _.map(segments, s => s.name)
    });
    return accumulator.concat(message);
  }, []);

  // eslint-disable-next-line no-unused-vars
  const messagesToTrack = filteredMessages.filter(message => {
    return (
      syncAgent.messageAdded(message) && syncAgent.messageWhitelisted(message)
    );
  });

  return (() => {
    if (filteredMessages.length > 0) {
      const sendUsersPromise = promiseRetry(
        retry => {
          return syncAgent
            .sendUserUpdateMessages(filteredMessages)
            .catch(error => {
              if (error instanceof ConfigurationError) {
                return Promise.reject(error);
              }
              return retry();
            });
        },
        { retries: 2, minTimeout: 0 }
      );
      return sendUsersPromise;
    }
    return Promise.resolve();
  })()
    .then(() => {
      if (
        messagesToTrack.length > 0 &&
        syncAgent.fetchUserActivityOnUpdate === true
      ) {
        // $FlowFixMe
        return trackUsers(ctx, {
          users: messagesToTrack.map(message => message.user)
        });
      }
      return Promise.resolve();
    })
    .catch(error => {
      ctx.client.logger.error("outgoing.job.error", {
        type: "notification",
        error: _.get(error, "message", "unknown"),
        stack: _.get(error, "stack")
      });
      ctx.notificationResponse = {
        flow_control: {
          type: "retry",
          size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 50,
          in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 10,
          in_time: parseInt(process.env.FLOW_CONTROL_IN_TIME, 10) || 30000
        }
      };
      return Promise.resolve();
    });
}

module.exports = userUpdateHandler;
