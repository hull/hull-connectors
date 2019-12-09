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
  const { search, claims, entity, include } = body;
  if (!search && (!claims || _.isEmpty(claims))) {
    return {
      status: 404,
      error: "Can't search for an empty value"
    };
  }

  const isUser = entity === "user";
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
    const { group } = ctx.client.utils.traits;
    const { user, account = {}, events = [] } = rawPayload;
    const userPayload =
      events && user && isUser
        ? {
            user: group(user),
            changes: getSample(user),
            events: events.filter(isVisible)
          }
        : {};
    const payload = {
      ...rawPayload,
      variables: varsFromSettings(ctx),
      account: group(account),
      changes: getSample(account),
      ...userPayload
    };

    const result = await compute(ctx, {
      source: "processor",
      claims: getClaims(isUser ? "user" : "account", rawPayload),
      preview: true,
      entity,
      payload,
      code
    });

    const data: Entry = {
      connectorId: connector.id,
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
