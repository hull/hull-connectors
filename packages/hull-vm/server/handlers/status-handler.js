// @flow
import type { HullContext, HullStatusResponse } from "hull";
import check from "../check";

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

  //   const c = check.(ctx, code);
  //   if (c) {
  //     console.log(c);
  //     status = "error";
  //     messages.push(
  //       `The code has syntax error(s). Please review the detected problems and apply fixes where indicated:
  // --------
  // ${c}
  // -------`
  //     );
  //   }

  const lintMessages = check.lint(ctx, code, {
    account_segment_ids: true,
    account_segments: true,
    account: true,
    changes: true,
    events: true,
    segment_ids: true,
    segments: true,
    user: true,
    variables: true
  });
  if (lintMessages.length) {
    status = "error";
    messages.push(...lintMessages);
  }

  return { messages, status };
}
