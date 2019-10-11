// @flow
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import _ from "lodash";
import queryString from "query-string";

// const GA_URL = "https://www.google-analytics.com/collect";
const GA_BATCH_URL = "https://www.google-analytics.com/batch";
// https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#t
const getQuery = ({
  ip,
  useragent,
  tid,
  cid,
  category,
  action,
  label,
  value,
  dimensions
}) => ({
  uip: ip,
  ua: useragent,
  v: 1,
  tid,
  cid,
  t: "event",
  ni: 1,
  aip: 1,
  ds: "app",
  ec: category,
  ev: value,
  el: label,
  ea: action,
  ...dimensions
});

const getDimensions = ({ dimensions, properties }) =>
  // $FlowFixMe
  _.reduce(
    dimensions,
    (m, v: string, i) => {
      m[`cd${i.toString()}`] = properties[v];
    },
    {}
  );

const update = async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  try {
    const { connector, request } = ctx;
    const { private_settings = {} } = connector;
    const { tid: tid_attribute, events: gaEvents } = private_settings;

    const tracks = _.reduce(
      messages,
      (payloads, message): Array<string> => {
        const { user, events } = message;
        const tid = user[tid_attribute];
        const cid = _.find(user.anonymous_ids, v => v.indexOf("ga:") === 0);
        if (!cid) {
          return payloads;
        }
        gaEvents.forEach(gaEvent => {
          events.forEach(
            ({ event: label, properties, context: { ip, useragent } }) => {
              if (label !== gaEvent.event) {
                return;
              }
              const payload = getQuery({
                tid,
                cid,
                ip,
                label,
                useragent,
                category: gaEvent.category,
                value: gaEvent.value,
                action: gaEvent.action,
                dimensions: getDimensions({
                  dimensions: gaEvent.dimensions,
                  properties
                })
              });
              payloads.push(queryString.stringify(payload));
            }
          );
        });
        return payloads;
      },
      []
    );
    await Promise.all(
      _.chunk(tracks, 20).map(chunk =>
        request
          .type("text")
          .post(GA_BATCH_URL)
          .send(chunk.join("\n"))
      )
    );
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
