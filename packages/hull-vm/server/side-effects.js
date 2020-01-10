// @flow
import type { HullUser, HullAccount, HullClient, HullContext } from "hull";
import _ from "lodash";
import { Map } from "immutable";
import type { Result, Event } from "../types";

type TraitsSignature =
  | {
      hullClient: $PropertyType<HullClient, "asUser">,
      data: $PropertyType<Result, "userTraits">,
      payload: HullUser,
      entity: "user",
      metric: $PropertyType<HullContext, "metric">
    }
  | {
      hullClient: $PropertyType<HullClient, "asAccount">,
      data: $PropertyType<Result, "accountTraits">,
      payload: HullAccount,
      entity: "account",
      metric: $PropertyType<HullContext, "metric">
    };

type AliasSignature =
  | {
      hullClient: $PropertyType<HullClient, "asUser">,
      data: $PropertyType<Result, "userAliases">,
      payload: HullUser,
      entity: "user",
      metric: $PropertyType<HullContext, "metric">
    }
  | {
      hullClient: $PropertyType<HullClient, "asAccount">,
      data: $PropertyType<Result, "accountAliases">,
      payload: HullAccount,
      entity: "account",
      metric: $PropertyType<HullContext, "metric">
    };

type EventSignature = {
  hullClient: $PropertyType<HullClient, "asUser">,
  data: Array<Event>,
  entity: string,
  metric: $PropertyType<HullContext, "metric">
};

const logIfNested = (client, attrs) => {
  _.map(attrs, (v, k: string) => {
    if (
      (_.isPlainObject(v) &&
        !_.isEqual(_.sortBy(_.keys(v)), ["operation", "value"])) ||
      (_.isArray(v) && _.some(v, vv => _.isObject(vv)))
    ) {
      client.logger.info(`Nested object found in key "${k}"`, v);
    }
  });
};

export const callTraits = async ({
  hullClient,
  data = Map({}),
  payload,
  entity,
  metric
}: TraitsSignature): Promise<any> => {
  let successful = 0;
  try {
    const responses = await Promise.all(
      data.toArray().map(async ([claimsMap, attrsMap]) => {
        const claims = claimsMap.toObject();
        const attrs = attrsMap.toObject();
        const client = hullClient(claims);
        try {
          logIfNested(client, attrs);
          // Filter undefined attributes
          const no_ops = {};
          const attributes = _.omitBy(attrs, (v, k: any) => {
            if (k === undefined) {
              return true;
            }
            const previous = _.get(payload, k.replace("/", "."));
            // Lodash allows deep object comparison
            if (_.isEqual(previous, v)) {
              no_ops[k] = "identical value";
              return true;
            }
            return false;
          });
          if (_.size(attributes)) {
            await client.traits(attributes);
          }
          successful += 1;
          return client.logger.debug(`incoming.${entity}.success`, {
            attributes,
            no_ops
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
    if (successful) metric.increment(`ship.incoming.${entity}s`, successful);
    return responses;
  } catch (err) {
    return Promise.reject(err);
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
          return client.logger.debug("incoming.event.success", {
            eventName,
            properties
          });
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
    if (successful) metric.increment(`ship.incoming.${entity}s`, successful);
    return responses;
  } catch (err) {
    return Promise.reject(err);
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
      data.toArray().map(async ([userClaimsMap, accountClaimsMap]) => {
        const accountClaims = accountClaimsMap.toObject();
        const userClaims = userClaimsMap.toObject();
        const client = hullClient(userClaims);
        try {
          successful += 1;
          await client.account(accountClaims).traits({});
          return client.logger.debug(`incoming.${entity}.link.success`, {
            accountClaims,
            userClaims
          });
        } catch (err) {
          return client.logger.error(`incoming.${entity}.link.error`, {
            hull_summary: `Error Linking User and account: ${err.message ||
              "Unexpected error"}`,
            user: userClaims,
            account: accountClaims,
            errors: err
          });
        }
      })
    );
    if (successful)
      metric.increment(`ship.incoming.${entity}s.link`, successful);
    return responses;
  } catch (err) {
    return Promise.reject(err);
  }
};

export const callAlias = async ({
  hullClient,
  data = Map({}),
  entity,
  payload,
  metric
}: AliasSignature): Promise<any> => {
  let successful = 0;
  try {
    const responses = await Promise.all(
      data.toArray().map(async ([claimsMap, operations]) => {
        const claims = claimsMap.toObject();
        const client = hullClient(claims);
        try {
          const opLog = await Promise.all(
            operations.toArray().map(async ([aliasClaims, operation]) => {
              const a = aliasClaims.toObject();
              const { anonymous_id } = a;
              if (
                payload &&
                payload.anonymous_ids &&
                ((operation === "alias" &&
                  payload.anonymous_ids.indexOf(anonymous_id) >= 0) ||
                  (operation === "unalias" &&
                    payload.anonymous_ids.indexOf(anonymous_id) === -1))
              ) {
                return [];
              }
              await client[operation === "alias" ? "alias" : "unalias"](a);
              successful += 1;
              return [a, operation];
            })
          );
          if (successful) {
            return client.logger.info(`incoming.${entity}.alias.success`, {
              claims,
              operations: opLog
            });
          }
          return [];
        } catch (err) {
          console.log(err);
          return client.logger.info(`incoming.${entity}.alias.error`, {
            claims,
            aliases: operations.toJS()
          });
        }
      })
    );
    if (successful)
      metric.increment(`ship.incoming.${entity}s.alias`, successful);
    return responses;
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};
