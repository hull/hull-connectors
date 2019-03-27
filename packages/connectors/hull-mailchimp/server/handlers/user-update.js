/* @flow */
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";

const _ = require("lodash");
const promiseRetry = require("promise-retry");
const Promise = require("bluebird");
const { ConfigurationError } = require("hull/src/errors");

const shipAppFactory = require("../lib/ship-app-factory");
const trackUsers = require("../jobs/track-users");

const flowControl = (type: "next" | "retry") => ({
  type,
  size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 50,
  in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 10,
  in_time: parseInt(process.env.FLOW_CONTROL_IN_TIME, 10) || 30000
});
/**
 * Handles notification about user changes
 */
export default function userUpdateHandler(
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): Promise<HullNotificationResponse> {
  const { syncAgent } = shipAppFactory(ctx);

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
  const messagesToTrack = filteredMessages.filter(
    message =>
      syncAgent.messageAdded(message) && syncAgent.messageWhitelisted(message)
  );

  return (() => {
    if (filteredMessages.length > 0) {
      const sendUsersPromise = promiseRetry(
        retry =>
          syncAgent.sendUserUpdateMessages(filteredMessages).catch(error => {
            if (error instanceof ConfigurationError) {
              return Promise.reject(error);
            }
            return retry();
          }),
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
        }).then(() => flowControl("next"));
      }
      return Promise.resolve(flowControl("next"));
    })
    .catch(error => {
      ctx.client.logger.error("outgoing.job.error", {
        type: "notification",
        error: _.get(error, "message", "unknown"),
        stack: _.get(error, "stack")
      });
      return Promise.resolve(flowControl("retry"));
    });
}
