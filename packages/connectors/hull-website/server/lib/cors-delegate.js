// @flow

import URI from "urijs";
import _ from "lodash";
import type { HullRequest, HullContext } from "hull";

export default function corsOptionsDelegate(
  req: HullRequest,
  callback: (null, any) => any
) {
  const { hull } = req;
  const { connector }: HullContext = hull;
  const { private_settings } = connector;
  const { whitelisted_domains } = private_settings;
  const corsOptions = {};
  const origin = req.header("Origin") || "";
  if (_.includes(whitelisted_domains, URI(origin).host())) {
    corsOptions.origin = true; // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions.origin = false; // disable CORS for this request
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
}
