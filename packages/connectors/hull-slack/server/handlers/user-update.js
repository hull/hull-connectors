// @flow
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import _ from "lodash";
import getNotification from "../lib/get-notification";
import logResponses from "../lib/log-responses";
import type { ConnectSlackFunction } from "../types";
const { getSegmentChanges } = require("../utils/get-segment-changes");

const debug = require("debug")("hull-slack:user-update");

const ENTITY = "user";
const update = (connectSlack: ConnectSlackFunction) => async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  const { client, connector, metric } = ctx;
  const { private_settings = {} } = connector;
  const {
    user_id = "",
    notify_events = [],
    attachements = []
  } = private_settings;

  let printedMessages = false;
  const duplicateEvents = new Set();

  try {
    const { post, tellOperator } = await connectSlack(ctx);
    if (!post || !tellOperator) {
      return {
        flow_control: {
          type: "next",
          size: 100
        }
      };
    }

    const responses = await Promise.all(
      _.map(messages, async (message: HullUserUpdateMessage) => {
        const { user } = message;

        const scopedClient = client.asUser(user);

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
              metric.increment("ship.outgoing.users");
              const { events = [], segments = [], changes = {} } = message;
              const segment = _.find(
                segments,
                s => s.id === synchronized_segment
              );
              // only match on events if the User is in the right segments
              const eventMatches =
                synchronized_segment === "ALL" || segment
                  ? events.filter(e => e.event === event)
                  : [];
              const segmentMatches = getSegmentChanges({
                event,
                synchronized_segment,
                changes
              });
              if (!eventMatches.length && !segmentMatches.length) {
                debug("Skipping Notification", {
                  event,
                  synchronized_segment,
                  channel,
                  message
                });
              }
              await Promise.all([
                ...eventMatches.map(async e => {
                  const payload = await getNotification({
                    message: { ...message, event: e, segment },
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
                }),
                ...segmentMatches.map(async match => {
                  const payload = await getNotification({
                    message: { ...message, ...match },
                    client,
                    text,
                    entity: ENTITY,
                    attachements
                  });
                  try {
                    const { id } = message.user;
                    if (id) {
                      const key = `${id}:${match.event.event}:${match.segment.name}:${match.segment.id}:${channel}`;
                      if (!duplicateEvents.has(key)) {
                        duplicateEvents.add(key);
                      } else if (!printedMessages) {
                        printedMessages = true;
                        const triggers = messages.map(m =>
                          _.pick(m, ["changes", "events"])
                        );
                        ctx.client.logger.info("Duplicate Notification", {
                          key,
                          triggers
                        });
                      }
                    }
                  } catch (err) {
                    ctx.client.logger(`error finding duplicates ${err}`);
                  }
                  post({
                    scopedClient,
                    payload,
                    channel,
                    entity: ENTITY
                  });
                })
              ]);
              return null;
            }
          );
          return null;
        } catch (err) {
          scopedClient.logger.error("outgoing.user.error", {
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
