// @flow

import type { HullContext } from "hull";
import _ from "lodash";
import compute from "./compute";
import ingest from "./ingest";
import saveRecent from "./save-recent";

const asyncComputeAndIngest = async (
  ctx: HullContext,
  {
    EntryModel,
    payload,
    code
  }: { code: string, payload: { [string]: any }, EntryModel: Object }
) => {
  const { client } = ctx;
  try {
    const result = await compute(ctx, {
      payload,
      code,
      preview: false
    });
    await ingest(ctx, { payload, code, result });
    await saveRecent(ctx, { EntryModel, payload, code, result });
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
