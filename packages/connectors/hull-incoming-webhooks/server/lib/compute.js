/* @flow */
import type { Result, ComputeOptions } from "../../types";

import run from "./sandbox";

export default async function compute({
  payload,
  connector,
  client,
  preview,
  code
}: ComputeOptions): Promise<Result> {
  const response = await run({
    context: payload,
    connector,
    client,
    code,
    preview
  });

  return {
    ...response,
    success: true
  };
}
