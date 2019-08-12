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
    code,
    source
  }: {
    code: string,
    payload: { [string]: any },
    EntryModel: Object,
    source: string
  }
) => {
  const { client } = ctx;
  try {
    const result = await compute(ctx, {
      payload,
      code,
      source,
      preview: false
    });
    // TODO: Check how errors in the second await could not have a defined error
    await ingest(ctx, result);
    await saveRecent(ctx, { EntryModel, payload, code, result });
  } catch (err) {
    client.logger.error("incoming.user.error", {
      hull_summary: `Error ingesting payload: ${_.get(
        err,
        "message",
        "Unexpected error"
      )}`,
      err
    });
  }
};

export default asyncComputeAndIngest;
