// @flow
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import _ from "lodash";
import { asyncComputeAndIngest, getClaims, varsFromSettings } from "hull-vm";

type FlowControl = {
  flow_size?: number,
  flow_in?: number
};
const update = ({ flow_size = 100, flow_in = 10 }: FlowControl) => async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  const { connector, client } = ctx;
  const { private_settings = {} } = connector;
  const { code = "", language = "javascript" } = private_settings;
  const { group } = client.utils.traits;

  // const user_ids = _.map(messages, "user.id");
  try {
    await _.reduce(
      messages,
      async (promise, payload, _key) =>
        asyncComputeAndIngest(ctx, {
          payload: _.omitBy(
            {
              changes: {},
              events: [],
              ...payload,
              variables: varsFromSettings(ctx),
              user: group(payload.user),
              account: group(payload.account)
            },
            _.isUndefined
          ),
          source: "processor",
          language,
          code,
          claims: getClaims("user", payload),
          entity: "user",
          preview: false
        }),
      Promise.resolve()
    );
    return {
      flow_control: {
        type: "next",
        size: flow_size,
        in: flow_in
      }
    };
  } catch (err) {
    ctx.client.logger.error("incoming.user.error", { error: err.message });
    return {
      flow_control: {
        type: "retry",
        size: flow_size,
        in: flow_in
      }
    };
  }
};
export default update;
