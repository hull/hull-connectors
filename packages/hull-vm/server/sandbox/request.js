// @flow
import request from "request-promise";
import type { Result } from "../../types";

export default function buildRequest(result: Result): any => any {
  return function req(...args) {
    result.isAsync = true;
    return request.defaults({ timeout: 3000 })(...args);
  };
}
