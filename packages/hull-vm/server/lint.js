// @flow
import { Linter } from "eslint";
import _ from "lodash";

const LIBS = [
  "_",
  "moment",
  "urijs",
  "hull",
  "console",
  "isInSegment",
  "enteredSegment",
  "leftSegment",
  "isGenericEmail",
  "isGenericDomain",
  "request",
  "captureException",
  "captureMessage"
];
const COMMON_VARS = ["ship", "results", "errors", "logs", "track", "traits"];
const linter = new Linter();

const getGlobals = (vars: Array<Array<string>>) =>
  _.fromPairs(_.uniq(_.flatten(vars)).map(v => [v, true]));

const getConfig = (payload?: Object = {}) => ({
  env: {
    es6: true
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
