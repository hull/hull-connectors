// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import _ from "lodash";
import type Entry from "../../types";
import formatPayload from "../lib/format-payload";
import serialize from "../serialize";

import compute from "../compute";

export default async function getEntity(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse {
  const { body } = message;
  // $FlowFixMe
  const { search, claims, entity, include, language, code } = body;
  if (!search && (!claims || _.isEmpty(claims))) {
    return {
      status: 404,
      error: "Can't search for an empty value"
    };
  }

  try {
    const payloads = await ctx.entities.get({
      claims,
      search,
      entity,
      include: {
        events: {
          ...include.events,
          per_page: 20,
          page: 1
        }
      }
    });

    const rawPayload = _.first(payloads.data);
    if (!rawPayload) {
      return {
        status: 404,
        error: `Can't find ${entity} with ${search}`
      };
    }
    const { claims: foundClaims, payload } = formatPayload(ctx, {
      entity,
      message: rawPayload
    });

    // Here we are saving 1 api call by direcly embedding the response
    const result = await compute(ctx, {
      source: "processor",
      claims: foundClaims,
      language,
      preview: true,
      entity,
      payload,
      code
    });

    const data: Entry = {
      date: new Date().toString(),
      result: serialize(result),
      code,
      payload
    };
    return {
      status: 200,
      data
    };
  } catch (err) {
    console.log(err);
    ctx.client.logger.error("fetch.user.error", { error: err.message });
    return {
      status: 200,
      error: err.message
    };
  }
}
