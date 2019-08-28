// @flow
import type { HullContext, HullStatusResponse } from "hull";
import { check } from "hull-vm";

export default async function statusCheck(
  ctx: HullContext
): HullStatusResponse {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const { code } = private_settings;

  if (check.empty(ctx, code)) {
    return {
      status: "warning",
      messages: [
        "This connector doesn't contain code. It is recommended for performance reasons to remove empty connectors from your organization."
      ]
    };
  }

  if (check.pristine(ctx, code)) {
    return {
      status: "setupRequired",
      messages: [
        'This connector contains the default "hello world" code. If you need help writing code, please refer to the connector documentation.'
      ]
    };
  }

  let status = "ok";
  const messages = [];

  const c = check.invalid(ctx, code);
  if (c) {
    console.log(c);
    status = "error";
    messages.push(
`The code has syntax error(s). Please review the detected problems and apply fixes where indicated:
--------
${c}
-------`
    );
  }

  const lintMessages = check.lint(ctx, code);
  if (lintMessages.length) {
    status = "error";
    messages.push(...lintMessages);
  }

  return { messages, status };
}
