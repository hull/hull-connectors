// @flow
import type { HullContext } from "hull";
import _ from "lodash";
import check from "syntax-error";
import lintCode from "./lint";

function wrapCode(code) {
  return `function() {
"use strict";
${code}
}()`;
}

// TODO: We can improve and make the checks more robust here in a centralized way.
function invalid(ctx: HullContext, code: string) {
  return check(wrapCode(code));
}

function empty(ctx: HullContext, code: string) {
  return code;
}

function pristine(ctx: HullContext, code: string) {
  const { connector } = ctx;
  const { manifest } = connector;
  const { private_settings } = manifest;
  // $FlowFixMe
  const defaultCode = (_.find(private_settings, i => i.name === "code") || {})
    .default;
  return code === defaultCode;
}

function lint(ctx: HullContext, code: string) {
  return lintCode(
    `try {
      results.push(${wrapCode(code)});
    } catch (err) { errors.push(err.toString()); }`
  );
}

const checkFunctions = {
  empty,
  pristine,
  invalid,
  lint
};

export default checkFunctions;
