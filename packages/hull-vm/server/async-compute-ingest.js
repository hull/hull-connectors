// @flow

import type {
  HullUserClaims,
  HullAccountClaims,
  HullEntityName,
  HullContext
} from "hull";
import _ from "lodash";
import type { Payload, SupportedLanguage } from "../types";
import compute from "./compute";
import ingest from "./ingest";
import saveRecent from "./save-recent";

const debug = require("debug")("hull:async-compute-ingest");

const asyncComputeAndIngest = async (
  ctx: HullContext,
  {
    EntryModel,
    payload,
    date,
    source,
    language,
    code,
    claims,
    entity,
    preview = false
  }: {
    source: string,
    code: string,
    date?: string,
    language?: SupportedLanguage,
    entity?: HullEntityName,
    claims?: HullUserClaims | HullAccountClaims,
    payload: Payload,
    EntryModel?: Object,
    preview?: boolean
  }
) => {
  const { client } = ctx;
  try {
    const result = await compute(ctx, {
      source,
      language,
      claims,
      payload,
      entity,
      code,
      preview
    });
    debug("Async Compute", {
      result,
      source,
      language,
      claims,
      payload,
      entity,
      code,
      preview
    });
    if (!preview) {
      // TODO: Check how errors in the second await could not have a defined error
      await ingest(ctx, result, claims, payload);
    }
    if (EntryModel) {
      await saveRecent(ctx, { EntryModel, date, payload, code, result });
    }
    return result;
  } catch (err) {
    client.logger.error(`incoming.${entity || "payload"}.error`, {
      hull_summary: `Error ingesting payload: ${_.get(
        err,
        "message",
        "Unexpected error"
      )}`,
      err
    });
    throw err;
  }
};

export default asyncComputeAndIngest;
