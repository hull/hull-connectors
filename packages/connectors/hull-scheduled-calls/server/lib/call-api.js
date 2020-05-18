// @flow

import _ from "lodash";
import neatCsv from "neat-csv";
import type { HullContext } from "hull";

type Headers = Array<{
  name: string,
  value: string
}>;

type PreparedHeader = {
  [string]: string
};

const parseHeaders = (headers: Headers): PreparedHeader =>
  _.reduce(
    headers,
    (m, v) => {
      m[v.name] = v.value;
      return m;
    },
    {}
  );
export default async function callApi({
  metric,
  request,
  client,
  connector
}: HullContext) {
  const { private_settings = {} } = connector;
  const {
    url,
    cookies = [],
    format = "JSON",
    method = "get",
    headers = [],
    body
  } = private_settings;
  const requestHeaders = parseHeaders(headers);

  // Set Headers
  if (_.size(requestHeaders)) {
    request.set(requestHeaders);
  }

  // Add Cookies
  if (cookies.length) {
    request = request.set("Cookie", cookies.join("; "));
  }

  // Set ≠expected response format
  if (format === "json") {
    request = request.type("json");
  }

  metric.increment("ship.service_api.call");
  try {
    const m = method.toLowerCase();
    const response = await (m === "get"
      ? request[m](url)
      : request[m](url).send(JSON.parse(body)));
    let responseBody;
    if (format === "JSON") {
      responseBody = response.body;
    } else if (format === "CSV") {
      try {
        responseBody = await neatCsv(response.text);
      } catch (err) {
        throw new Error("Couldn't parse CSV Response");
      }
    } else {
      responseBody = response.text;
    }

    const payload = !response.ok
      ? { error: response.error }
      : {
          body: responseBody,
          headers: response.headers,
          status: response.statusCode,
          date: new Date(),
          url,
          method,
          requestHeaders,
          requestBody: JSON.parse(body)
        };

    if (!response.ok) {
      throw new Error(response.error);
    }
    client.logger.debug(
      "connector.request.data",
      _.pick(payload, ["error", "body", "method", "params", "query"])
    );
    return payload;
  } catch (err) {
    throw err;
  }
}
