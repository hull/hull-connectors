// @flow

import type {
  HullUserClaims,
  HullAccountClaims,
  HullEntityType,
  HullContext
} from "hull";
import _ from "lodash";
import type { SupportedLanguage } from "../types";
import compute from "./compute";
import ingest from "./ingest";
import saveRecent from "./save-recent";

const asyncComputeAndIngest = async (
  ctx: HullContext,
  {
    EntryModel,
    payload,
    source,
    language,
    code,
    claims,
    entityType,
    preview = false
  }: {
    source: string,
    code: string,
    language?: SupportedLanguage,
    entityType?: HullEntityType,
    claims: HullUserClaims | HullAccountClaims,
    payload: { [string]: any },
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
      entityType,
      code,
      preview
    });
    if (!preview) {
      // TODO: Check how errors in the second await could not have a defined error
      await ingest(ctx, result);
    }
    if (EntryModel) {
      await saveRecent(ctx, { EntryModel, payload, code, result });
    }
    return result;
  } catch (err) {
    client.logger.error("incoming.user.error", {
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
