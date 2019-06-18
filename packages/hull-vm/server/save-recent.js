// @flow

import type { HullContext } from "hull";
import type { Entry, Payload, Result } from "../types";
import serialize from "./serialize";
export default function saveRecent(
  ctx: HullContext,
  {
    EntryModel,
    code,
    result,
    payload
  }: {
    result: Result,
    code: string,
    payload: Payload,
    EntryModel: Object
  }
) {
  const { connector, client, metric } = ctx;
  const entry: Entry = {
    connectorId: connector.id,
    result: serialize(result),
    code,
    payload,
    date: new Date().toString()
  };
  return EntryModel.create(entry);
}
