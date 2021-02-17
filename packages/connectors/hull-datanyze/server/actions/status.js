// @flow
import type { HullContext, HullStatusResponse } from "hull";
import _ from "lodash";

async function statusCheckAction(ctx: HullContext): HullStatusResponse {
  const { connector: ship } = ctx;
  const { private_settings } = ship;
  const { username, token, synchronized_segments } = private_settings;

  const any_enabled = _.size(synchronized_segments) > 0;

  if (!token || !username) {
    return {
      status: "setupRequired",
      message:
        "No Credentials stored, connector is inactive. Enter Username and Token in Settings"
    };
  }
  if (!any_enabled) {
    return {
      status: "warning",
      message:
        "Enrich enabled, but no segments are listed. No one will be enriched"
    };
  }

  // TODO replace with superagent
  /* return request({
    uri: "http://api.datanyze.com/limits/",
    json: true,
    resolveWithFullResponse: true,
    qs: { token, email: username }
  }).then(response => {
    const body = response.body;
    if (body && response.statusCode === 200) {
      const { api_monthly, api_monthly_limit } = body;
      if (api_monthly < api_monthly_limit / 10) {
        return {
          status: "warning",
          message: `Low API Calls Remaining: ${api_monthly}/${api_monthly_limit}`
        };
      }
      return {
        status: "ok",
        message: `API Calls Remaining: ${api_monthly}/${api_monthly_limit}`
      };
    }
    return {
      status: "ok",
      message: `Error from Datanyze API: ${response.statusMessage}`
    };
  });*/
  return { status: "ok", message: "ok" };
}

module.exports = statusCheckAction;
