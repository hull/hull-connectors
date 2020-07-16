// @flow
import { v4 as uuidv4 } from "uuid";

export default function getUUID(): any => any {
  return function uuid(options: {}): string {
    return uuidv4(options);
  };
}
