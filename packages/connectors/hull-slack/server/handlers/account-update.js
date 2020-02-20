// @flow
import type {
  HullContext,
  HullAccountUpdateMessage,
  HullNotificationResponse
} from "hull";
import _ from "lodash";
import getNotification from "../lib/get-notification";
import logResponses from "../lib/log-responses";
import type { ConnectSlackFunction } from "../types";
const { getSegmentChanges } = require("../utils/get-segment-changes");

const debug = require("debug")("hull-slack:account-update");

const ENTITY = "account";

const update = (connectSlack: ConnectSlackFunction) => async (
  ctx: HullContext,
  messages: Array<HullAccountUpdateMessage>
): HullNotificationResponse => {
  const { client, connector, metric } = ctx;
  const { private_settings = {} } = connector;
  const {
    user_id = "",
    notify_account_events = [],
    attachements = []
  } = private_settings;
  try {
    const { post, tellOperator } = await connectSlack(ctx);
    if (!post || !tellOperator) {
      client.logger.error("Slack isn't setup properly", {
        post: !!post,
        tellOperator: !!tellOperator
      });
      return {
        flow_control: {
          type: "next",
          size: 100,
          in: 0.1
        }
      };
    }
    const responses = await Promise.all(
      _.map(messages, async (message: HullAccountUpdateMessage) => {
        const { account } = message;

        const scopedClient = client.asAccount(account);
        try {
          _.map(
            notify_account_events,
            async ({
              event,
              synchronized_segment,
              channel,
              text
            }: {
              event: string,
              synchronized_segment: string,
              channel: string,
              text: string
            }) => {
              metric.increment("ship.outgoing.account");
              const { changes = {} } = message;
              const segmentMatches = getSegmentChanges({
                event,
                synchronized_segment,
                changes
              });
              if (!segmentMatches.length) {
                debug("Skipping Notification", {
                  event,
                  synchronized_segment,
                  channel,
                  message
                });
              }
              await Promise.all(
                segmentMatches.map(async match => {
                  const payload = await getNotification({
                    message: { ...message, ...match },
                    client,
                    text,
                    entity: ENTITY,
                    attachements
                  });
                  post({ scopedClient, payload, channel, entity: ENTITY });
                })
              );
              return null;
            }
          );
          return null;
        } catch (err) {
          scopedClient.logger.error("outgoing.account.error", {
            error: err.message
          });
          tellOperator({
            user_id,
            msg: `:crying_cat_face: Something bad happened while posting to the channels :${err.message}`
          });
          return null;
        }
      })
    );
    logResponses(client, responses);
    return {
      flow_control: {
        type: "next",
        size: 100,
        in: 0.1
      }
    };
  } catch (err) {
    return {
      flow_control: {
        type: "retry",
        size: 100,
        in: 5
      }
    };
  }
};

export default update;
