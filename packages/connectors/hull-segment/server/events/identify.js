// @flow

import _, { isEmpty, reduce, includes } from "lodash";
import scoped from "../scope-hull-client";
import type { HullContext } from "hull";

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
    (t, v, k) => {
      if (v == null) return t;
      if (ALIASED_FIELDS[k.toLowerCase()]) {
        t[ALIASED_FIELDS[k.toLowerCase()]] = v;
      } else if (!includes(IGNORED_TRAITS, k)) {
        t[k] = v;
      }
      return u;
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

  if (integrations?.Hull?.id === true) {
    data.hullId = data.userId;
    delete data.userId;
  }

  if (_.isEmpty(data.traits)) {
    return true;
  }

  try {
    const asUser = client.asUser({
      email: t.email,
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
        id: user.id,
        userId,
        anonymousId
      });
    }
    try {
      await scoped(hull, user, shipSettings, { active }).traits(traits);
      asUser.logger.debug("incoming.user.success", {
        payload,
        traits: t
      });
      metric("request.identify.updateUser");
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
    metric("request.identify.updateUser.error");
    client
      .asUser({ external_id: userId, anonymous_id: anonymousId })
      .logger.error("incoming.user.error", { payload, errors: error });
  }
}
