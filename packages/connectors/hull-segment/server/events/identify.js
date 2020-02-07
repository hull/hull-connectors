// @flow

import { isEmpty, reduce, includes } from "lodash";
import type { HullContext } from "hull";
import scoped from "../lib/scope-hull-client";
import type { SegmentIncomingIdentify } from "../types";

const ALIASED_FIELDS = {
  lastname: "last_name",
  firstname: "first_name",
  createdat: "created_at"
};

const IGNORED_TRAITS = ["id", "external_id"];

export default async function handleIdentify(
  ctx: HullContext,
  message: SegmentIncomingIdentify
) {
  const { client, connector, metric } = ctx;
  const { settings } = connector;
  const { context, traits = {}, userId, anonymousId } = message;
  const { email } = traits;
  const { active = false } = context || {};

  const errorPayload = { userId, anonymousId, email };

  try {
    const asUser = scoped(client, message, settings, { active });
    try {
      const user = reduce(
        traits || {},
        (u, v, k) => {
          if (v == null) return u;
          if (ALIASED_FIELDS[k.toLowerCase()]) {
            u.traits[ALIASED_FIELDS[k.toLowerCase()]] = v;
          } else if (!includes(IGNORED_TRAITS, k)) {
            u.traits[k] = v;
          }
          return u;
        },
        { userId, anonymousId, traits: {} }
      );

      if (isEmpty(user.traits)) {
        return asUser.logger.info("incoming.user.skip", {
          message: "No traits found in Segment payload",
          traits: user.traits
        });
      }
      return await asUser.traits(user.traits);
    } catch (err) {
      asUser.logger.error("incoming.user.error", {
        ...errorPayload,
        message: err.message,
        errors: err
      });
      metric.increment("request.identify.updateUser.error");
    }
  } catch (e) {
    client.logger.error("incoming.user.error", { message: e.message });
  }
  return undefined;
}
