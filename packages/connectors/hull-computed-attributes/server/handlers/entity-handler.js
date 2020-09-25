// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullExternalResponse,
  HullEntityName,
  HullEntityClaims
} from "hull";
import type { Payload } from "hull-vm";

import _ from "lodash";
import { formatPayload } from "hull-vm";
import buildResponse from "../lib/build-response";

export type ComputedAttributesResponse = {
  payload: Payload,
  entity?: HullEntityName,
  claims?: HullEntityClaims,
  computedAttributes?: {},
  code: string
};

export default async function getEntity(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse {
  const { body } = message;
  // $FlowFixMe
  const { search, claims, entity, computedAttributes } = body;
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
      entity
    });

    const rawPayload = _.first(payloads.data);
    if (!rawPayload) {
      return {
        status: 404,
        error: `Can't find ${entity} with ${search}`
      };
    }
    const { claims: foundClaims, payload: tempPayload } = formatPayload(ctx, {
      entity,
      message: rawPayload
    });

    // For now we don't have a good way to access arrays. so they're omitted.
    const payload = _.omit(tempPayload, [
      "segments",
      "account_segments",
      "changes",
      "events",
      "segment_ids",
      "account_segment_ids"
    ]);

    // Here we are saving 1 api call by direcly embedding the response

    const traits = await buildResponse({ payload, computedAttributes });

    return {
      status: 200,
      data: {
        date: new Date().toString(),
        payload,
        result: {
          source: "computed-attributes",
          claims: foundClaims,
          traits,
          entity,
          error: [],
          success: true
        }
      }
    };
  } catch (error) {
    console.log(error);
    ctx.client.logger.error("fetch.user.error", { error: error.message });
    return {
      status: 200,
      error: error.message
    };
  }
}
