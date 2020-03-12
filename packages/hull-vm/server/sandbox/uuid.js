// @flow
import { v4 as uuidv4 } from "uuid";
import type { HullContext } from "hull";
import type { Result } from "../../types";

export default function getUUID(
  _ctx: HullContext,
  _result: Result
): any => any {
  return function uuid(options: {}): string {
    return uuidv4(options);
  };
}
