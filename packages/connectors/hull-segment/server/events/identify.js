// @flow

import { isEmpty, reduce, includes } from 'lodash';
import scoped from '../scope-hull-client';
import type { HullContext, SegmentIncomingIdentify } from '../types';

const ALIASED_FIELDS = {
  lastname: 'last_name',
  firstname: 'first_name',
  createdat: 'created_at'
};

const IGNORED_TRAITS = [
  'id',
  'external_id',
  'guest_id',
  'uniqToken',
  'visitToken'
];

function update(client, message, useHullId, shipSettings, active) {
  try {
    const { userId, anonymousId, traits = {} } = message;
    const { email } = traits || {};

    const asUser = client.asUser({
      external_id: userId,
      email,
      anonymous_id: anonymousId
    });

    if (shipSettings.ignore_segment_userId === true && !email && !anonymousId) {
      const logPayload = { id: message.id, anonymousId, email };
      const reason =
        "No email address or anonymous ID present when ignoring segment's user ID.";
      asUser.logger.info('incoming.user.skip', {
        reason,
        logPayload
      });
      return Promise.reject(reason);
    }
    if (!userId && !anonymousId) {
      const logPayload = { id: message.id, userId, anonymousId };
      const reason = 'No user ID or anonymous ID present.';
      asUser.logger.info('incoming.user.skip', {
        reason,
        logPayload
      });
      return Promise.reject(reason);
    }

    return scoped(client, message, useHullId, shipSettings, { active })
      .traits(traits)
      .then(
        (/* response */) => {
          return { traits };
        },
        error => {
          error.params = traits;
          throw error;
        }
      );
  } catch (err) {
    return Promise.reject(err);
  }
}

export default function handleIdentify(
  ctx: HullContext,
  message: SegmentIncomingIdentify
) {
  const { client, connector, metric } = ctx;
  const {
    context,
    traits = {},
    userId,
    anonymousId,
    integrations = {}
  } = message;
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

  if (!isEmpty(user.traits)) {
    const useHullId = integrations.Hull && integrations.Hull.id === true;
    const updating = update(
      client,
      user,
      useHullId,
      connector.settings,
      active
    );

    updating.then(
      ({ traits = {} }) => {
        metric.increment('request.identify.updateUser');
        client
          .asUser({
            email: traits.email,
            external_id: userId,
            anonymous_id: anonymousId
          })
          .logger.info('incoming.user.success', { traits });
      },
      error => {
        metric.increment('request.identify.updateUser.error');
        client
          .asUser({ external_id: userId, anonymous_id: anonymousId })
          .logger.error('incoming.user.error', { errors: error });
      }
    );

    return updating;
  }
  return user;
}
