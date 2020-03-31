// @flow
import type { HullUser, HullAccount, HullClient, HullContext } from "hull";
import _ from "lodash";
import type { SerializedResult, HullSerializedClaims } from "../types";

type EventSignature = {
  client: HullClient,
  data: $PropertyType<SerializedResult, "events">,
  entity: string,
  metric: $PropertyType<HullContext, "metric">
};

type TraitsSignature =
  | {
      client: HullClient,
      data: $PropertyType<SerializedResult, "userTraits">,
      payload: HullUser,
      subjects: string,
      metric: $PropertyType<HullContext, "metric">
    }
  | {
      client: HullClient,
      data: $PropertyType<SerializedResult, "accountTraits">,
      payload: HullAccount,
      subjects: string,
      metric: $PropertyType<HullContext, "metric">
    };

type AliasSignature =
  | {
      client: HullClient,
      data: $PropertyType<SerializedResult, "userAliases">,
      payload: HullUser,
      subjects: string,
      metric: $PropertyType<HullContext, "metric">
    }
  | {
      client: HullClient,
      data: $PropertyType<SerializedResult, "accountAliases">,
      payload: HullAccount,
      subjects: string,
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

export const getClient = (client: HullClient, claims: HullSerializedClaims) => {
  const { asUser, asAccount, subjectType } = claims;
  if (subjectType === "user") {
    return _.size(asAccount)
      ? client.asUser(asUser, {}, asAccount)
      : client.asUser(asUser);
  }

  if (!_.size(asUser) && !_.size(asAccount)) {
    throw new Error("Can't find Claims to build a client");
  }
  if (subjectType === "user" && !_.size(asUser)) {
    throw new Error("Can't find User Claims to build a user client");
  }
  return _.size(asUser)
    ? client.asUser(asUser).account(asAccount)
    : client.asAccount(asAccount);
};

export const callIdentify = async ({
  client,
  data = [],
  payload,
  subjects,
  metric
}: TraitsSignature): Promise<any> => {
  let successful = 0;
  try {
    const responses = await Promise.all(
      data.map(async ([claims, attrs]) => {
        const { subjectType } = claims;
        const scoped = getClient(client, claims);
        try {
          logIfNested(scoped, attrs);
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
            await scoped.traits(attributes);
          }
          successful += 1;
          return scoped.logger.debug(`incoming.${subjectType}.success`, {
            attributes,
            no_ops
          });
        } catch (err) {
          console.log("Error", err);
          return scoped.logger.error(`incoming.${subjectType}.error`, {
            hull_summary: `Error saving Attributes: ${err.message ||
              "Unexpected error"}`,
            claims,
            errors: err
          });
        }
      })
    );
    if (successful) metric.increment(`ship.incoming.${subjects}s`, successful);
    return responses;
  } catch (err) {
    return Promise.reject(err);
  }
};

export const callEvents = async ({
  client,
  data = [],
  entity,
  metric
}: EventSignature): Promise<any> => {
  try {
    let successful = 0;
    const responses = await Promise.all(
      data.map(async ({ claims, event }) => {
        const { eventName, properties, context } = event;
        const scoped = getClient(client, claims);
        try {
          successful += 1;
          await scoped.track(eventName, properties, {
            ip: "0",
            source: "code",
            ...context
          });
          return client.logger.debug("incoming.event.success", {
            eventName,
            properties
          });
        } catch (err) {
          return scoped.logger.error("incoming.event.error", {
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
    console.log(err);
    throw err;
  }
};

export const callLinks = async ({
  client,
  data,
  entity,
  metric
}: {
  client: $PropertyType<HullClient, "asUser">,
  data: $PropertyType<SerializedResult, "accountLinks">,
  entity: "account",
  metric: $PropertyType<HullContext, "metric">
}): Promise<any> => {
  try {
    let successful = 0;
    const responses = await Promise.all(
      data.map(async ([claims, asAccount]) => {
        const scoped = getClient(client, { ...claims, asAccount });
        try {
          successful += 1;
          await scoped.traits({});
          return scoped.logger.debug(`incoming.${entity}.link.success`, {
            asAccount,
            claims
          });
        } catch (err) {
          return client.logger.error(`incoming.${entity}.link.error`, {
            hull_summary: `Error Linking User and account: ${err.message ||
              "Unexpected error"}`,
            user: claims,
            account: asAccount,
            errors: err
          });
        }
      })
    );
    if (successful)
      metric.increment(`ship.incoming.${entity}s.link`, successful);
    return responses;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const callAlias = async ({
  client,
  data = [],
  subjects,
  payload,
  metric
}: AliasSignature): Promise<any> => {
  let successful = 0;
  try {
    const responses = await Promise.all(
      data.map(async ([claims, aliases]) => {
        const { subjectType } = claims;
        const scoped = getClient(client, claims);
        try {
          const opLog = await Promise.all(
            aliases.map(async ({ claim, operation }) => {
              const { anonymous_id } = claim;
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
              await scoped[operation === "alias" ? "alias" : "unalias"](claim);
              successful += 1;
              return { claim, operation };
            })
          );
          if (successful) {
            return scoped.logger.info(`incoming.${subjectType}.alias.success`, {
              claims,
              operations: opLog
            });
          }
          return undefined;
        } catch (err) {
          console.log("Error", err);
          return scoped.logger.error(`incoming.${subjectType}.alias.error`, {
            claims,
            aliases
          });
        }
      })
    );
    if (successful)
      metric.increment(`ship.incoming.${subjects}s.alias`, successful);
    return responses;
  } catch (err) {
    console.log("Error", err);
    return Promise.reject(err);
  }
};
