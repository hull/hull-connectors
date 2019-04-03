// @flow
import type { HullClient, HullContext } from "hull";
import type { UserTraits, AccountTraits, Event, Links } from "../../types";

type TraitsSignature =
  | {
      hullClient: $PropertyType<HullClient, "asUser">,
      data: Array<UserTraits>,
      entity: "user",
      metric: $PropertyType<HullContext, "metric">
    }
  | {
      hullClient: $PropertyType<HullClient, "asAccount">,
      data: Array<AccountTraits>,
      entity: "account",
      metric: $PropertyType<HullContext, "metric">
    };

export const callTraits = async ({
  hullClient,
  data,
  entity,
  metric
}: TraitsSignature): Promise<any> => {
  let successful = 0;
  try {
    const responses = await Promise.all(
      data.map(
        async ({ traits: { attributes, context }, claims, claimsOptions }) => {
          const client = hullClient(claims, claimsOptions);
          try {
            await client.traits(attributes);
            successful += 1;
            return client.logger.info(`incoming.${entity}.success`, {
              attributes,
              context
            });
          } catch (err) {
            return client.logger.error(`incoming.${entity}.error`, {
              errors: err
            });
          }
        }
      )
    );
    metric.increment(`ship.incoming.${entity}s`, successful);
    return responses;
  } catch (err) {
    console.log(err);
    return Promise.reject();
  }
};

type EventSignature = {
  hullClient: $PropertyType<HullClient, "asUser">,
  data: Array<Event>,
  entity: string,
  metric: $PropertyType<HullContext, "metric">
};
export const callEvents = async ({
  hullClient,
  data,
  entity,
  metric
}: EventSignature): Promise<any> => {
  try {
    let successful = 0;
    const responses = await Promise.all(
      data.map(async ({ event, claims, claimsOptions }) => {
        const { eventName, properties, context } = event;
        const client = hullClient(claims, claimsOptions);
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
  data: Array<Links>,
  entity: string = "account",
  metric: $PropertyType<HullContext, "metric">
): Promise<any> => {
  try {
    let successful = 0;
    const responses = await Promise.all(
      data.map(async ({ claims, claimsOptions, accountClaims }) => {
        const client = hullClient(claims, claimsOptions);
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
