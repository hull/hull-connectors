// @flow
import _ from "lodash";
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";
import getHash from "../lib/get-hash";

const toDropcontactMapping = hash =>
  _.map(hash, (hull, service) => ({
    service,
    hull
  }));

const updateAccount = ({
  flow_size,
  flow_in,
  flow_in_time
}: {
  flow_size: number,
  flow_in: number,
  flow_in_time: number
}) => async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  const { helpers, connector, enqueue, request, metric, client, cache } = ctx;
  const { mapAttributes } = helpers;
  const { private_settings } = connector;
  const {
    api_key,
    last_name,
    first_name,
    company,
    email,
    website,
    phone
  } = private_settings;
  try {
    if (!api_key) {
      throw new Error("No API Key - please set it up in the settings");
    }
    metric.increment("ship.service_api.call");
    const attributeMap = payload =>
      mapAttributes({
        payload,
        direction: "outgoing",
        mapping: toDropcontactMapping({
          last_name,
          first_name,
          company,
          email,
          website,
          phone
        })
      });
    const enrichable = messages
      .filter(m => !m.user["dropcontact/emails"])
      .map(attributeMap);
    const cachedHashes = await Promise.all(
      enrichable.map(getHash).map(hash => cache.get(hash))
    );
    const data = enrichable.filter((v, i) => cachedHashes[i] !== true);

    client.logger.info("outgoing.user.start", {
      cachedHashes,
      enrichable,
      notQueued: data
    });

    const response = await request
      .post("https://api.dropcontact.io/batch?hashedInputs=true")
      .set({ "X-Access-Token": api_key })
      .send({
        data,
        hashedInputs: true,
        siren: true
      });

    const {
      error,
      request_id,
      success,
      credits_left,
      hashedInputs
    } = response.body;

    if (error) {
      throw new Error(error);
    }
    client.logger.info("outgoing.user.success", {
      hashedInputs,
      data
    });
    client.logger.info("outgoing.job.queue", {
      request_id,
      data,
      cachedHashes,
      hashedInputs
    });

    // Set a cache for pending requests.
    await Promise.all(hashedInputs.map(hash => cache.set(hash, true)));

    if (credits_left !== undefined) {
      metric.value("ship.service_api.remaining", credits_left);
    }
    if (credits_left <= 0) {
      throw new Error("Insufficient credits");
    }

    if (success && request_id) {
      enqueue(
        "enrich",
        {
          request_id,
          ids: _.map(data, "id"),
          hashes: hashedInputs
        },
        {
          delay: 5 * 1000,
          // attempts: 5,
          ttl: 120 * 1000,
          backoff: { delay: 30 * 1000, type: "fixed" }
        }
      );
    }
    return {
      type: "next",
      size: flow_size,
      in: flow_in,
      in_time: flow_in_time
    };
  } catch (error) {
    ctx.client.logger.error("outgoing.user.error", {
      error: _.get(error, "body.error") || error.message || error
    });
    return {
      type: "retry",
      size: flow_size,
      in: 0,
      in_time: 100
    };
  }
};
export default updateAccount;
