// @flow
import type {
  HullContext,
  HullEvent,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import _ from "lodash";
import type { Entry } from "hull-vm";
import { compute, serialize, varsFromSettings } from "hull-vm";
import getSample from "../lib/get-sample";
import getClaims from "../lib/get-claims";

const EXCLUDED_EVENTS = [
  "Attributes changed",
  "Entered segment",
  "Left segment",
  "Segments changed"
];

export const isVisible = ({ event }: HullEvent) =>
  !_.includes(EXCLUDED_EVENTS, event);

export default async function getEntity(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse {
  const { connector } = ctx;
  const { private_settings } = connector;
  const { code } = private_settings;
  const { body } = message;
  // $FlowFixMe
  const { search, claims, entity, include, per_page = 10, page = 1 } = body;
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
      per_page,
      page,
      include: {
        events: {
          ...include.events,
          per_page: 20,
          page: 1
        }
      }
    });

    if (!payloads.data) {
      return {
        status: 404,
        error: `Can't find ${entity} with ${search}`
      };
    }

    return {
      status: 200,
      data: {
        connectorId: connector.id,
        date: new Date().toString(),
        code,
        payloads
      }
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
