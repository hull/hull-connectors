// @flow

import rest from "restler";
import type { HullContext } from "hull/src/types/context";

const _ = require("lodash");

const ERROR_CODE = {
  ACCESS_DENIED: 101
};

export default function admin(ctx: HullContext, message, res) {
  const { username, token } = ctx.connector.private_settings;
  const connectorName = "Datanyze";
  if (!username || !token) {
    res.render("noauthconfig.html", { name: connectorName });
  } else {
    rest
      .get("http://api.datanyze.com/limits/", {
        query: { email: username, token }
      })
      .on("success", function onLimitSuccess(limits = {}) {
        ctx.client.logger.debug("datanyze.rate.debug", limits);

        const { error } = limits;

        res.render("admin.html", {
          limits,
          progress: {
            hourly: Math.ceil(
              (limits.api_hourly / limits.api_hourly_limit) * 100
            ),
            daily: Math.ceil((limits.api_daily / limits.api_daily_limit) * 100),
            monthly: Math.ceil(
              (limits.api_monthly / limits.api_monthly_limit) * 100
            )
          },
          validations: {
            authenticated: _.isNil(error) || error !== ERROR_CODE.ACCESS_DENIED,
            api_monthly_limit: limits.api_monthly_limit || 0
          },
          connected: !!token && !!username && !!limits.api_monthly_limit,
          name: connectorName
        });
      });
  }
}
