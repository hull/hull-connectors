// @flow
import type { HullContext, HullStatusResponse } from "hull";
import _ from "lodash";

export default async function statusHandler(
  ctx: HullContext
): HullStatusResponse {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const {
    synchronized_user_segments,
    api_key,
    last_name,
    first_name,
    company,
    email,
    website,
    phone
  } = private_settings;

  let status = "ok";

  const messages = [];

  try {
    if (!api_key) {
      status = "setupRequired";
      messages.push("No API Key detected. Please configure it in the settings");
    }
    if (!synchronized_user_segments) {
      status = "warning";
      messages.push("No User segments selected. No one will be enriched");
    }
    if (
      _.every([last_name, first_name, company, email, website, phone], i => !i)
    ) {
      status = "warning";
      messages.push(
        "No mapping is set for lookup in the Settings. Dropcontact won't return anything"
      );
    }
  } catch (err) {
    status = "error";
    messages.push(err);
  }

  return { messages, status };
}
