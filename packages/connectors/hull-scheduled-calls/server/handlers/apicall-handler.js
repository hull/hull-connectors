// @flow

import _ from "lodash";
import neatCsv from "neat-csv";
import type {
  HullContext,
  // HullResponse,
  HullExternalResponse
} from "hull";
import { asyncComputeAndIngest } from "hull-vm";

export default function handler(EntryModel: Object) {
  return async (ctx: HullContext, message: HullIncomingHandlerMessage): HullExternalResponse => {
    const { client, connector } = ctx;
    const { body } = message;

    // let { connector = {} } = req.body;
    if (!body || typeof body !== "object") {
      return {
        status: 500,
        text: "Invalid Payload, Body must be an object"
      };
    }




    const { private_settings = {} } = connector;
    const { code } = private_settings;

    // Stop if we aren't initialized properly, notifying sender that we couldn't find the proper credentials
    if (!client || !connector) {
      return {
        status: 404,
        data: {
          reason: "connector_not_found",
          message: "We couldn't find a connector for this token"
        }
      };
    }
    const {
      url,
      cookies = [],
      format = "JSON",
      method = "get",
      headers = {},
      body
    } = private_settings;

    let req = ctx.request;

    // Set Headers
    if (_.size(headers)) {
      _.map(headers, function setHeaders(v: string, k: string) {
        req = req.set(k, v);
      });
    }

    // Add Cookies
    if (cookies.length) {
      req = req.headers("Cookie", cookies.join("; "));
    }

    // Set ≠expected response format
    if (format === "json") {
      req = req.type("json");
    }

    // Send body
    if (_.size(body)) {
      req = req.send(body);
    }
    metric.increment("ship.service_api.call");
    try {
      const response = await req[method.toLowerCase()](url);

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
            date: new Date(),
            url,
            method,
            requestHeaders: headers,
            requestBody: body,
            responseHeaders: response.headers,
            status: response.statusCode,
            responseBody
          };

      if (!response.ok) {
        throw new Error(response.error);
      }
      client.logger.debug(
        "connector.request.data",
        _.pick(payload, ["error", "body", "method", "params", "query"])
      );

      asyncComputeAndIngest(ctx, {
        source: "scheduled-calls",
        EntryModel,
        payload,
        code
      });

      return {
        status: 200,
        data: {
          ok: true
        }
      };
    } catch (err) {
      client.logger.error("connector.request.error", {
        url,
        cookies,
        format,
        method,
        headers,
        body,
        error: err
      });
      return {
        status: 500,
        data: {
          error: err
        }
      };
    }
  };
}
