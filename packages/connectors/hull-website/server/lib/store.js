// @flow

import type { HullContext } from "hull";
import Lru from "redis-lru";
import _ from "lodash";
import type { Store as StoreReturnValue } from "../../types";

export default function Store(redis: any): StoreReturnValue {
  const LRU = {};
  const POOL = {};

  const pool = (id: string, eventId?: string) => {
    // for now, don't store the reference to eventId (memory leaks etc...)
    // if (id && eventId !== undefined) POOL[id] = eventId;
    if (id && eventId !== undefined) POOL[id] = true;
    return POOL[id];
  };

  const get = async (id: string) => {
    const res = await redis.get(id);
    return JSON.parse(res);
  };

  const set = (id: string, value: any) => redis.set(id, JSON.stringify(value));

  const lru = (id: string) => {
    if (LRU[id]) return LRU[id];
    const l = Lru(redis, { max: 1000, maxAge: 150000, namespace: id });
    LRU[id] = l;
    return l;
  };

  /**
   * Expose a cache system to store runtime settings
   * @param  {Object} ctx the Context object created by a valid Hull middleware.
   * @return {function} setup: prepare LRU and set ship cache for a specific ship
   * @return {function} get: get ship settings from an ID
   * @return {function} set: set ship settings by ID
   * @return {function} lru: get a ship-scoped LRU so we can set/get users from it. Each ship gets it's own LRU
   */
  const setup = (ctx: HullContext /* , _io */): Promise<any> => {
    if (!_.size(ctx)) {
      return Promise.reject(new Error("No context object"));
    }
    // Cache the current config.
    const {
      clientCredentialsEncryptedToken,
      clientCredentials,
      connector
    } = ctx;
    if (!clientCredentialsEncryptedToken || !connector) {
      return Promise.reject(new Error("No config in Context object"));
    }

    const { id } = clientCredentials;
    if (!id) {
      return Promise.reject(new Error("Couldn't find Connector ID"));
    }

    lru(id);

    return set(id, {
      // connector: { id, private_settings, settings },
      clientCredentialsEncryptedToken
    });
  };
  return { get, set, setup, lru, pool };
}
