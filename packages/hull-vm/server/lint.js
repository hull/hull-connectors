// @flow
import { Linter } from "eslint";

const linter = new Linter();
const CONFIG = {
  env: {
    es6: true
  },
  globals: {
    changes: false,
    _: false,
    moment: false,
    urijs: false,
    user: false,
    account: false,
    events: false,
    segments: false,
    account_segments: false,
    ship: false,
    payload: false,
    results: false,
    errors: false,
    logs: false,
    track: false,
    traits: false,
    hull: false,
    request: false,
    console: false,
    captureMessage: false,
    captureException: false,
    isGenericEmail: false,
    isGenericDomain: false,
    isInSegment: false,
    enteredSegment: false,
    leftSegment: false
  },
  rules: {
    "no-undef": [2]
  }
};

function formatLinterError({ line, column, source, message }) {
  return `Error at line ${line}, column ${column}
${source}
--------------------------
${message}`;
}

export default function lint(code: string): Array<string> {
  return linter
    .verify(code, CONFIG, { filename: "Code" })
    .map(formatLinterError);
}
