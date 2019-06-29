// @flow

import type {
  HullContext,
  HullEntitySymbol,
  HullUserUpdateMessage,
  HullAccountUpdateMessage
} from "hull";
import _ from "lodash";
import { compute, ingest } from "hull-vm";

const asyncComputeAndIngest = async (
  ctx: HullContext,
  {
    payload,
    code,
    entity
  }: {
    code: string,
    entity: HullEntitySymbol,
    payload: HullUserUpdateMessage | HullAccountUpdateMessage
  }
) => {
  const { connector, client, metric } = ctx;
  try {
    const { user = {}, account } = payload;
    const result = await compute(ctx, {
      claims: _.pick(entity === "account" ? account : user, ["id"]),
      preview: false,
      entity,
      payload,
      code
    });
    return await ingest(ctx, result);
  } catch (err) {
    client.logger.error(`incoming.${entity}.error`, {
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
