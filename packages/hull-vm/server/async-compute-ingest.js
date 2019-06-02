//@flow

import type { HullContext } from "hull";
import compute from "./compute";
import ingest from "./ingest";
import _ from "lodash";

const asyncComputeAndIngest = async (
  ctx: HullContext,
  {
    EntryModel,
    payload,
    code
  }: {
    code: string,
    payload: {
      [string]: any
    },
    EntryModel: Object
  }
) => {
  const { connector, client, metric } = ctx;
  try {
    const result = await compute(ctx, {
      context: payload,
      code,
      preview: false
    });
    await ingest(ctx, { EntryModel, payload, code, result });
  } catch (err) {
    client.logger.error("incoming.user.error", {
      hull_summary: `Error Processing user: ${_.get(
        err,
        "message",
        "Unexpected error"
      )}`,
      err
    });
  }
};

export default asyncComputeAndIngest;
