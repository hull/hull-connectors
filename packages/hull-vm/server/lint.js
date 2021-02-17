// @flow
import { Linter } from "eslint";
import _ from "lodash";
import getLibs from "./sandbox/libs";

const LIBS = [
  // $FlowFixMe
  ..._.keys(
    getLibs(
      {
        request: {
          timeout: () => 0
        }
      },
      {}
    )
  ),
  "console",
  "captureException",
  "captureMessage",
  "isInSegment",
  "enteredSegment",
  "enteredAccountSegment",
  "leftSegment",
  "leftAccountSegment"
];

const COMMON_VARS = [
  "hull",
  "body",
  "ship",
  "connector",
  "results",
  "errors",
  "logs",
  "variables"
];

const linter = new Linter();

const getGlobals = (vars: Array<Array<string>>) =>
  _.fromPairs(_.uniq(_.flatten(vars)).map(v => [v, true]));

const getConfig = (payload?: Object = {}) => ({
  env: {
    es6: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: "module"
  },
  rules: {
    "no-undef": [2]
  },
  globals: getGlobals([_.keys(payload), LIBS, COMMON_VARS])
});

function formatLinterError({ line, column, source, message }) {
  return `Error at line ${line}, column ${column}
${source}
--------------------------
${message}`;
}

export default function lint(code: string, payload?: Object): Array<string> {
  return linter
    .verify(code, getConfig(payload), { filename: "Code" })
    .map(formatLinterError);
}
