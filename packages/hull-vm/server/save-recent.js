// @flow

import type { HullContext } from "hull";
import type { Entry, Payload, SerializedResult } from "../types";

export default function saveRecent(
  ctx: HullContext,
  {
    EntryModel,
    code,
    result,
    payload
  }: {
    result: SerializedResult,
    code: string,
    payload: Payload,
    EntryModel: Object
  }
) {
  const { connector } = ctx;
  const entry: Entry = {
    connectorId: connector.id,
    result,
    code,
    payload,
    date: new Date().toString()
  };
  return EntryModel.create(entry);
}
