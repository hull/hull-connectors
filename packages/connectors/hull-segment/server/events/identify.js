// @flow

import type { HullContext } from "hull";
import _ from "lodash";
import scoped from "../lib/scope-hull-client";

const ALIASED_FIELDS = {
  lastname: "last_name",
  firstname: "first_name",
  createdat: "created_at"
};

const IGNORED_TRAITS = [
  "id",
  "external_id",
  "guest_id",
  "uniqToken",
  "visitToken"
];

const alias_traits = traits =>
  _.reduce(
    traits,
    (tt, v, k) => {
      if (v == null) return tt;
      if (ALIASED_FIELDS[k.toLowerCase()]) {
        tt[ALIASED_FIELDS[k.toLowerCase()]] = traits;
      } else if (!_.includes(IGNORED_TRAITS, k)) {
        tt[k] = v;
      }
      return tt;
    },
    {}
  );

export default async function handleIdentify(ctx: HullContext, payload) {
  const { client, metric, connector } = ctx;
  const { settings } = connector;
  const { ignore_segment_userId } = settings;
  const {
    context = {},
    traits = {},
    userId,
    anonymousId,
    integrations = {}
  } = payload;
  const { active = false } = context;

  const data = {
    userId,
    anonymousId,
    traits: alias_traits(traits)
  };

  const { email } = data.traits;

  if (integrations?.Hull?.id === true) {
    data.hullId = data.userId;
    delete data.userId;
  }

  if (_.isEmpty(data.traits)) {
    return true;
  }

  try {
    const asUser = client.asUser({
      email,
      external_id: userId,
      anonymous_id: anonymousId
    });

    if (ignore_segment_userId === true && !email && !anonymousId) {
      return asUser.logger.debug("incoming.user.skip", {
        reason:
          "No email address or anonymous ID present when ignoring segment's user ID.",
        payload,
        userId,
        anonymousId,
        email,
        traits
      });
    }

    if (!userId && !anonymousId) {
      return asUser.logger.debug("incoming.user.skip", {
        reason: "No user ID or anonymous ID present.",
        id: userId,
        userId,
        anonymousId
      });
    }
    try {
      await scoped(ctx, data, { active }).traits(traits);
      asUser.logger.debug("incoming.user.success", {
        payload,
        data
      });
      metric.increment("request.identify.updateUser");
    } catch (error) {
      error.params = traits;
      throw error;
    }

    // try {
    //   const topLevelEmail = payload.email;
    //   if (topLevelEmail) {
    //     scopedClient.logger.debug(
    //       `Contains a top level email in identify call: ${topLevelEmail}`
    //     );
    //   }
    // } catch (error) {
    //   console.log(`Error logging toplevel email ${payload.email}`);
    // }
  } catch (error) {
    metric.increment("request.identify.updateUser.error");
    client
      .asUser({ external_id: userId, anonymous_id: anonymousId })
      .logger.error("incoming.user.error", { payload, errors: error });
    throw error;
  }
  return true;
}
