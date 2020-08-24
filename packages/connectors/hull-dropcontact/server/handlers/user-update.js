// @flow
import _ from "lodash";
import type {
  HullContext,
  HullUserUpdateMessage,
  HullNotificationResponse
} from "hull";

const IN_ENRICH_QUEUE = "queued";

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
  const {
    helpers,
    connector,
    enqueue,
    request,
    metric,
    client,
    cache,
    isBatch
  } = ctx;
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

    // Filter out users who shouldn't be enriched
    const enrichable = messages.filter(
      m => isBatch || !m.user["dropcontact/emails"]
    );

    // Query the cache to fetch the status for each enrichable user ID
    // TODO: Find a way to be more reliable when looking up users
    // as the User ID could have changed due to a merge
    // This is a deeper issue and there is no reliable fix today.
    // It probably needs to be fixed at the platform level by making asUser({ id }) able to resolve
    // to merged IDs
    const cacheResults = await Promise.all(
      enrichable.map(message => cache.get(_.get(message, "user.id")))
    );
    // exclude the enrichments that already are in the cache
    // We do it in 2 steps as fetching the Cache is asynchronous.
    // Then turn it into an array of Dropcontact-ready payloads
    const queuable = enrichable.filter(
      (v, i) => cacheResults[i] !== IN_ENRICH_QUEUE
    );
    const queuablePayloads = queuable.map(attributeMap);
    const ids = _.map(queuable, "user.id");

    client.logger.info("outgoing.user.start", {
      cacheResults,
      queuablePayloads
    });

    if (queuablePayloads.length) {
      metric.increment("ship.service_api.call", queuablePayloads.length);
      const response = await request
        .post("https://api.dropcontact.io/batch?hashedInputs=true")
        .set({ "X-Access-Token": api_key })
        .send({
          data: queuablePayloads,
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

      client.logger.info("outgoing.job.queue", {
        request_id,
        success,
        queuablePayloads,
        cacheResults,
        hashedInputs
      });

      if (credits_left !== undefined) {
        metric.value("ship.service_api.remaining", credits_left);
      }

      if (credits_left <= 0) {
        throw new Error("Insufficient credits");
      }

      // Set a cache for pending requests.
      // Todo: rely on HashedInputs to properly cache what has been requested
      // Unfortunately it's useless for now
      await Promise.all(ids.map(id => cache.set(id, IN_ENRICH_QUEUE)));

      if (success && request_id) {
        enqueue(
          "enrich",
          { request_id, ids },
          {
            delay: 5 * 1000,
            attempts: 5,
            ttl: 120 * 1000,
            backoff: { delay: 30 * 1000, type: "fixed" }
          }
        );
      }
    } else {
      client.logger.info("outgoing.user.skip", {
        message: "No users to enrich",
        queuablePayloads
      });
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
