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

const debug = require("debug")("hull-slack:account-update");

const ENTITY = "account";
const getSegmentChangeEvents = ({ event, synchronized_segment, changes }) => {
  const { left = [], entered = [] } = changes.account_segments || {};
  if (event === "ENTERED_ACCOUNT_SEGMENT") {
    const segment_entered = _.find(entered, e => e.id === synchronized_segment);
    if (segment_entered) {
      return [
        {
          event: {
            event: "Entered Account Segment"
          },
          segment: segment_entered
        }
      ];
    }
  }
  if (event === "LEFT_ACCOUNT_SEGMENT") {
    const segment_left = _.find(left, e => e.id === synchronized_segment);
    if (segment_left) {
      return [
        {
          event: {
            event: "Left Account Segment"
          },
          segment: segment_left
        }
      ];
    }
  }
  return [];
};

const update = (connectSlack: ConnectSlackFunction) => async (
  ctx: HullContext,
  messages: Array<HullAccountUpdateMessage>
): HullNotificationResponse => {
  const { client, connector, metric } = ctx;
  const { private_settings = {} } = connector;
  const {
    user_id = "",
    notify_events = [],
    attachements = []
  } = private_settings;
  try {
    const { post, tellOperator } = await connectSlack(ctx);
    if (!post || !tellOperator) {
      return {
        flow_control: "next",
        size: 100,
        in: 1
      };
    }
    const responses = await Promise.all(
      _.map(messages, async (message: HullAccountUpdateMessage) => {
        const { account } = message;

        const scopedClient = client.asAccount(account);
        try {
          _.map(
            notify_events,
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
              const segmentMatches = getSegmentChangeEvents({
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
                  post({
                    scopedClient,
                    payload,
                    channel,
                    entity: ENTITY
                  });
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
