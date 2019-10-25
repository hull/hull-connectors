// @flow
import type { HullUser, HullAccount, HullClient, HullContext } from "hull";
import _ from "lodash";
import type { SerializedResult, HullClaims } from "../types";

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
      _.isObject(v) &&
      !_.isEqual(_.sortBy(_.keys(v)), ["operation", "value"])
    ) {
      client.logger.info(`Nested object found in key "${k}"`, v);
    }
  });
};

export const getClient = (client: HullClient, claims: HullClaims) => {
  const { asUser, asAccount, subject } = claims;
  if (subject === "user") {
    return client.asUser(asUser);
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
        const { subject } = claims;
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
          return scoped.logger.info(`incoming.${subject}.success`, {
            attributes,
            no_ops
          });
        } catch (err) {
          return scoped.logger.error(`incoming.${subject}.error`, {
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
          return scoped.logger.info("incoming.event.success", {
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
    return Promise.reject(err);
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
        const { subject } = claims;
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
          return scoped.logger.info(`incoming.${subject}.alias.success`, {
            claims,
            aliases: opLog
          });
        } catch (err) {
          console.log(err);
          return scoped.logger.info(`incoming.${subject}.alias.error`, {
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
    console.log(err);
    return Promise.reject(err);
  }
};
