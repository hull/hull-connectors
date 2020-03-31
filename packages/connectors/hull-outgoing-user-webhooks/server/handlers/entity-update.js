// @flow
import type {
  HullContext,
  HullEntityName,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import { compute } from "hull-vm";
import type { PrivateSettings } from "hull-webhooks/types";
import {
  getHeaders,
  getPayloads,
  getTriggers,
  getFilters
} from "hull-webhooks";

type FlowControl = {
  flow_size?: number,
  flow_in?: number
};

// TODO move to outgoing-webhooks
const entityUpdate = (entity: HullEntityName) => (
  { flow_in, flow_size }: FlowControl,
  getThrottle: Function
) => {
  return async (
    ctx: HullContext,
    messages: Array<HullUserUpdateMessage>
  ): HullNotificationResponse => {
    const { client, connector, request, clientCredentials } = ctx;
    const { id } = clientCredentials;
    const {
      private_settings = {}
    }: { private_settings: PrivateSettings } = connector;
    const {
      code,
      throttle_rate,
      throttle_per_rate,
      concurrency,
      headers,
      url
    } = private_settings;

    const throttle = getThrottle({
      id,
      options: {
        rate: throttle_rate,
        ratePer: throttle_per_rate,
        concurrent: concurrency
      }
    });

    const triggers = getTriggers(entity, private_settings);
    const filters = getFilters(entity, private_settings);

    try {
      await Promise.all(
        messages.map(async message =>
          Promise.all(
            getPayloads({ ctx, message, entity, triggers, filters }).map(
              async payload => {
                const result = await compute(ctx, {
                  source: "outgoing-webhooks",
                  language: "jsonata",
                  payload,
                  entity,
                  preview: false,
                  code
                });

                const response = await request
                  .use(throttle.plugin())
                  .post(url)
                  .set(getHeaders(ctx) || {})
                  .send(result.data);

                if (!response || response.error || response.status >= 400) {
                  client.logger.error(`outgoing.${entity}.error`, {
                    url,
                    headers,
                    code,
                    payload,
                    body: response.body,
                    message: response.error,
                    status: response.status
                  });
                  throw new Error(response.error);
                }
                client.logger.info(`outgoing.${entity}.success`, {
                  url,
                  headers,
                  payload,
                  message: response.body
                });
                return response;
              }
            )
          )
        )
      );
      // TODO: Refine Kraken response based on Customer Settings for throttle rate
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
};

export default entityUpdate;
