import { isEmpty, reduce, includes } from "lodash";
import scoped from "../scope-hull-client";

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

function updateUser(hull, user, shipSettings, active) {
  try {
    const { userId, anonymousId, traits = {} } = user;
    const { email } = traits || {};

    const asUser = hull.asUser({
      external_id: userId,
      email,
      anonymous_id: anonymousId
    });

    if (shipSettings.ignore_segment_userId === true && !email && !anonymousId) {
      const logPayload = { id: user.id, anonymousId, email };
      asUser.logger.debug("incoming.user.skip", {
        reason:
          "No email address or anonymous ID present when ignoring segment's user ID.",
        logPayload
      });
      return Promise.resolve({ skip: true });
    } else if (!userId && !anonymousId) {
      const logPayload = { id: user.id, userId, anonymousId };
      asUser.logger.debug("incoming.user.skip", {
        reason: "No user ID or anonymous ID present.",
        logPayload
      });
      return Promise.resolve({ skip: true });
    }

    return scoped(hull, user, shipSettings, { active })
      .traits(traits)
      .then(
        (/* response */) => ({ skip: false, traits }),
        (error) => {
          error.params = traits;
          throw error;
        }
      );
  } catch (err) {
    return Promise.reject(err);
  }
}

export default function handleIdentify(payload, { hull, metric, ship }) {
  const { context, traits, userId, anonymousId, integrations = {} } = payload;
  const { active = false } = context || {};
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

  if (integrations.Hull && integrations.Hull.id === true) {
    user.hullId = user.userId;
    delete user.userId;
  }
  if (!isEmpty(user.traits)) {
    const updating = updateUser(hull, user, ship.settings, active);

    updating.then(
      ({ skip = false, traits: t = {} }) => {
        metric("request.identify.updateUser");

        const scopedClient = hull
          .asUser({
            email: t.email,
            external_id: userId,
            anonymous_id: anonymousId
          });

        scopedClient.logger.debug(`incoming.user.${skip ? "skip" : "success"}`, {
          payload,
          traits: t
        });

        try {
          const topLevelEmail = payload.email;
          if (topLevelEmail) {
            scopedClient.logger.debug(`Contains a top level email in identify call: ${topLevelEmail}`);
          }
        } catch (error) {
          console.log(`Error logging toplevel email ${payload.email}`);
        }
      },
      (error) => {
        metric("request.identify.updateUser.error");
        hull
          .asUser({ external_id: userId, anonymous_id: anonymousId })
          .logger.error("incoming.user.error", { payload, errors: error });
      }
    );

    return updating;
  }
  return user;
}
