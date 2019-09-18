// @flow
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import _ from "lodash";

const GA_URL = "https://www.google-analytics.com/collect";
// https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#t
const getQuery = ({
  tid,
  cid,
  category,
  action,
  label,
  value,
  dimensions
}) => ({
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
    const { tid, events: gaEvents } = private_settings;
    await Promise.all(
      messages.map(({ user, events }) => {
        const cid = _.find(user.anonymous_ids, v => v.indexOf("ga:") === 0);
        if (!cid) return undefined;
        return gaEvents.map(eventConfig =>
          _.filter(events, event => event.event === eventConfig.event).map(
            ({ event: eventName, properties }) =>
              request
                .query(
                  getQuery({
                    tid,
                    cid,
                    category: eventConfig.category,
                    label: eventName,
                    value: eventConfig.value,
                    action: eventConfig.action,
                    dimensions: getDimensions({
                      dimensions: eventConfig.dimensions,
                      properties
                    })
                  })
                )
                .post(GA_URL)
          )
        );
      })
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
