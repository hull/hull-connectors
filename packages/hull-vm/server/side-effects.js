// @flow
import type { HullClient, HullContext } from "hull";
import type { Result, Event, Links } from "../types";

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
      Array.from(data, async ([attributes, claims]) => {
        const client = hullClient(claims);
        try {
          await client.traits(attributes);
          successful += 1;
          return client.logger.info(`incoming.${entity}.success`, {
            attributes
          });
        } catch (err) {
          return client.logger.error(`incoming.${entity}.error`, {
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
            source: "incoming-webhook",
            ...context
          });
          return client.logger.info(`incoming.${entity}.success`);
        } catch (err) {
          return client.logger.error(`incoming.${entity}.error`, {
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

export const callLinks = async (
  hullClient: $PropertyType<HullClient, "asUser">,
  data: Array<Links> = [],
  entity: string = "account",
  metric: $PropertyType<HullContext, "metric">
): Promise<any> => {
  try {
    let successful = 0;
    const responses = await Promise.all(
      data.map(async ({ claims, accountClaims }) => {
        const client = hullClient(claims);
        try {
          successful += 1;
          await client.account(accountClaims).traits({});
          return client.logger.info(`incoming.${entity}.link.success`);
        } catch (err) {
          return client.logger.error(`incoming.${entity}.link.error`, {
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
