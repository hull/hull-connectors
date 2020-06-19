/* @flow */
import type { HullContext, HullJob } from "hull";
import _ from "lodash";

const debug = require("debug")("hull-dropcontact:enrich");

/**
 * SyncIn : import all the list members as hull users
 */
export default async function enrichQueue(
  ctx: HullContext,
  {
    request_id,
    ids,
    hashes
  }: { request_id: string, ids: Array<string>, hashes: Array<string> },
  _job: HullJob
) {
  const { cache, request, client, helpers, connector } = ctx;
  const { mapAttributes } = helpers;
  const { private_settings } = connector;
  const {
    link_user_in_hull,
    incoming_user_attributes,
    incoming_account_attributes,
    api_key
  } = private_settings;
  if (!api_key) {
    throw new Error("Missing API Key");
  }
  const response = await request
    .get(`https://api.dropcontact.io/batch/${request_id}`)
    .set({
      "X-Access-Token": api_key
    });
  debug("Dropcontact Response", response);

  const { data, error, reason, success } = response.body;
  if (error) {
    client.logger.error("outgoing.job.error", { error, reason });
    // We don't throw an error otherwise we would attempt again.
    return {
      error
    };
  }
  if (!success) {
    client.logger.info("outgoing.job.progress", {
      request_id,
      response: response.body
    });
    // We throw an error so that we attempt this job again
    throw new Error(reason);
  }
  if (data) {
    try {
      await Promise.all(
        data.map(async (payload, index) => {
          const asUser = client.asUser({
            ...(payload?.email?.length
              ? { email: payload.email[0].email }
              : {}),
            id: ids[index]
          });

          const asAccount = link_user_in_hull
            ? asUser.account({ domain: payload.website })
            : undefined;

          const accountPromises = link_user_in_hull
            ? [
                payload.vat &&
                  asAccount.alias({
                    anonymous_id: `vat:${payload.vat}`
                  }),
                payload.siret &&
                  asAccount.alias({
                    anonymous_id: `siret:${payload.siret}`
                  }),
                payload.siren &&
                  asAccount.alias({
                    anonymous_id: `siren:${payload.siren}`
                  }),
                asAccount.traits(
                  mapAttributes({
                    payload,
                    direction: "incoming",
                    mapping: incoming_account_attributes
                  })
                )
              ]
            : [];

          return Promise.all([
            cache.del(hashes[index]),
            asUser.traits(
              mapAttributes({
                payload,
                direction: "incoming",
                mapping: incoming_user_attributes
              })
            ),
            ..._.compact(accountPromises)
          ]);
        })
      );
      client.logger.info("outgoing.job.success", {
        request_id,
        data,
        success,
        reason
      });
    } catch (err) {
      client.logger.info("outgoing.job.error", {
        request_id,
        data,
        success,
        reason,
        err
      });
    }
    return true;
  }
  return true;
}
