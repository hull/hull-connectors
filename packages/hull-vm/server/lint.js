// @flow
import { Linter } from "eslint";

const linter = new Linter();
const CONFIG = {
  env: {
    es6: true
  },
  globals: {
    changes: true,
    _: true,
    moment: true,
    urijs: true,
    user: true,
    account: true,
    events: true,
    segments: true,
    account_segments: true,
    ship: true,
    payload: true,
    results: true,
    errors: true,
    logs: true,
    track: true,
    traits: true,
    hull: true,
    request: true,
    console: true,
    captureMessage: true,
    captureException: true,
    isGenericEmail: true,
    isGenericDomain: true,
    isInSegment: true,
    enteredSegment: true,
    leftSegment: true
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
