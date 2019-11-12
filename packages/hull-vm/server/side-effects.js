// @flow
import type { HullClient, HullContext } from "hull";
import type { Result, Event } from "../types";

type TraitsSignature =
  | {
      hullClient: $PropertyType<HullClient, "asUser">,
      data: $PropertyType<Result, "userTraits">,
      entity: "user",
      metric: $PropertyType<HullContext, "metric">
    }
  | {
      hullClient: $PropertyType<HullClient, "asAccount">,
      data: $PropertyType<Result, "accountTraits">,
      entity: "account",
      metric: $PropertyType<HullContext, "metric">
    };

type EventSignature = {
  hullClient: $PropertyType<HullClient, "asUser">,
  data: Array<Event>,
  entity: string,
  metric: $PropertyType<HullContext, "metric">
};

export const callTraits = async ({
  hullClient,
  data = new Map(),
  entity,
  metric
}: TraitsSignature): Promise<any> => {
  let successful = 0;
  try {
    const responses = await Promise.all(
      Array.from(data, async ([claims, attributes]) => {
        const client = hullClient(claims);
        try {
          await client.traits(attributes);
          successful += 1;
          return client.logger.debug(`incoming.${entity}.success`, {
            attributes
          });
        } catch (err) {
          return client.logger.error(`incoming.${entity}.error`, {
            hull_summary: `Error saving Attributes: ${err.message ||
              "Unexpected error"}`,
            [entity]: claims,
            errors: err
          });
        }
      })
    );
    metric.increment(`ship.incoming.${entity}s`, successful);
    return responses;
  } catch (err) {
    console.log(err);
    return Promise.reject();
  }
};

export const callEvents = async ({
  hullClient,
  data = [],
  entity,
  metric
}: EventSignature): Promise<any> => {
  try {
    let successful = 0;
    const responses = await Promise.all(
      data.map(async ({ event, claims }) => {
        const { eventName, properties, context } = event;
        const client = hullClient(claims);
        try {
          successful += 1;
          await client.track(eventName, properties, {
            ip: "0",
            source: "code",
            ...context
          });
          return client.logger.debug("incoming.event.success");
        } catch (err) {
          return client.logger.error("incoming.event.error", {
            hull_summary: `Error processing Event: ${err.message ||
              "Unexpected error"}`,
            user: claims,
            errors: err,
            event
          });
        }
      })
    );
    metric.increment(`ship.incoming.${entity}`, successful);
    return responses;
  } catch (err) {
    console.log(err);
    return Promise.reject();
  }
};

export const callLinks = async ({
  hullClient,
  data,
  entity,
  metric
}: {
  hullClient: $PropertyType<HullClient, "asUser">,
  data: $PropertyType<Result, "accountLinks">,
  entity: "account",
  metric: $PropertyType<HullContext, "metric">
}): Promise<any> => {
  try {
    let successful = 0;
    const responses = await Promise.all(
      Array.from(data, async ([claims, accountClaims]) => {
        const client = hullClient(claims);
        try {
          successful += 1;
          await client.account(accountClaims).traits({});
          return client.logger.debug(`incoming.${entity}.link.success`);
        } catch (err) {
          return client.logger.error(`incoming.${entity}.link.error`, {
            hull_summary: `Error Linking User and account: ${err.message ||
              "Unexpected error"}`,
            user: claims,
            account: accountClaims,
            errors: err
          });
        }
      })
    );
    metric.increment(`ship.incoming.${entity}`, successful);
    return responses;
  } catch (err) {
    console.log(err);
    return Promise.reject();
  }
};
