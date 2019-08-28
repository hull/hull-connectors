// @flow

import type {
  HullContext,
  HullEntityType,
  HullUserUpdateMessage,
  HullAccountUpdateMessage
} from "hull";
import _ from "lodash";
import { compute, ingest } from "hull-vm";
import getClaims from "./get-claims";

const asyncComputeAndIngest = async (
  ctx: HullContext,
  {
    payload,
    code,
    entity
  }: {
    code: string,
    entity: HullEntityType,
    payload: HullUserUpdateMessage | HullAccountUpdateMessage
  }
) => {
  const { client } = ctx;
  try {
    const { user, account } = payload;
    const { group } = ctx.client.utils.traits;
    const claims = getClaims(entity, payload);
    const result = await compute(ctx, {
      source: "processor",
      claims,
      preview: false,
      entity,
      payload: _.omitBy(
        {
          ...payload,
          user: group(user),
          account: group(account)
        },
        _.isUndefined
      ),
      code
    });
    return await ingest(ctx, result);
  } catch (err) {
    return client.logger.error(`incoming.${entity}.error`, {
      hull_summary: `Error Processing ${entity}: ${_.get(
        err,
        "message",
        "Unexpected error"
      )}`,
      err
    });
  }
};

export default asyncComputeAndIngest;
