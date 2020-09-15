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
  fallbacks?: {},
  code: string
};

export default async function getEntity(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse {
  const { connector } = ctx;
  const { private_settings } = connector;
  const { locals, fallbacks } = private_settings;
  const { body } = message;
  // $FlowFixMe
  const { search, claims, entity, include } = body;
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

    const { data, traits } = await buildResponse({
      locals,
      payload,
      fallbacks
    });

    return {
      status: 200,
      data: {
        date: new Date().toString(),
        payload,
        result: {
          source: "computed-attributes",
          claims: foundClaims,
          data,
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
