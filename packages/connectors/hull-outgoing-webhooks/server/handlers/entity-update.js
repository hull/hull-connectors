// @flow
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import { compute } from "hull-vm";
import getHeaders from "../lib/get-headers";
import getPayloads from "../lib/get-payloads";
import getTriggers from "../lib/get-triggers";

type FlowControl = {
  flow_size?: number,
  flow_in?: number
};
const update = entityType => (
  { flow_in, flow_size }: FlowControl,
  getThrottle: Function
) => {
  return async (
    ctx: HullContext,
    messages: Array<HullUserUpdateMessage>
  ): HullNotificationResponse => {
    const { client, connector, request, clientCredentials } = ctx;
    const { id } = clientCredentials;
    const { private_settings = {} } = connector;
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

    const triggers = getTriggers(entityType)(private_settings);

    try {
      await Promise.all(
        messages.map(async message =>
          Promise.all(
            getPayloads(ctx, message, triggers).map(async payload => {
              const result = await compute(ctx, {
                source: "outgoing-webhooks",
                language: "jsonata",
                payload,
                entity: entityType,
                preview: false,
                code
              });

              const response = await request
                .use(throttle.plugin())
                .post(url)
                .set(getHeaders(ctx) || {})
                .send(result.data);

              if (!response || response.error || response.status >= 400) {
                client.logger.error(`outgoing.${entityType}.error`, {
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
              client.logger.info(`outgoing.${entityType}.success`, {
                url,
                headers,
                payload,
                message: response.body
              });
              return response;
            })
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

export default update;