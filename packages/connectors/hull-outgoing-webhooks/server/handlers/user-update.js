// @flow
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import _ from "lodash";
import SuperagentThrottle from "superagent-throttle";
import shouldSendMessage from "../lib/should-send-message";

type FlowControl = {
  flow_size?: number,
  flow_in?: number
};
const update = ({ flow_in, flow_size }: FlowControl) => async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  const { client, connector, request } = ctx;
  const { private_settings = {} } = connector;
  const {
    code,
    throttle_rate,
    throttle_per_rate,
    concurrency,
    headers,
    synchronized_attributes,
    url
  } = private_settings;
  const { group } = client.utils.traits;
  const throttle = new SuperagentThrottle({
    rate: throttle_rate,
    ratePer: throttle_per_rate,
    concurrent: concurrency
  });
  try {
    await Promise.all(
      messages.map(async message => {
        const payload = {
          ...message,
          user: _.pick(message.user, synchronized_attributes)
        };
        if (shouldSendMessage(private_settings, message)) {
          const response = await request
            .set(headers || {})
            .send(payload)
            .post(url)
            .use(throttle.plugin());

          if (!response || response.error || response.status > 400) {
            throw new Error(response.error);
          }
        }
      })
    );
    return {
      status: 200,
      flow_control: {
        type: "next",
        size: flow_size,
        in: flow_in
      },
      data: {}
    };
  } catch (err) {
    client.logger.error("connector.request.error", {
      ...private_settings,
      error: err
    });
    return {
      status: 500,
      flow_control: {
        type: "next",
        size: flow_size,
        in: flow_in
      },
      data: {
        error: err
      }
    };
  }
};
export default update;
