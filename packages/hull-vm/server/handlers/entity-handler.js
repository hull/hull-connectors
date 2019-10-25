// @flow
import type {
  HullContext,
  HullEvent,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import _ from "lodash";
import type { Entry } from "hull-vm";
import { compute, serialize } from "hull-vm";
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
  const { claims, entity, include } = body;
  if (!claims || _.isEmpty(claims)) {
    return {
      status: 404,
      error: "Can't search for an empty value"
    };
  }
  const isUser = entity === "user";
  try {
    const rawPayloads = await ctx.entities.get({
      claims,
      entity,
      include: {
        events: {
          ...include.events,
          per_page: 20,
          page: 1
        }
      }
    });

    if (!rawPayloads || !rawPayloads.length) {
      return {
        status: 404,
        error: `Can't find ${entity}`
      };
    }
    const { group } = ctx.client.utils.traits;
    const rawPayload = _.first(rawPayloads);
    const { user, account, events = [] } = rawPayload;
    const payload = isUser
      ? {
          ...rawPayload,
          user: group(user),
          account: group(account),
          changes: getSample(user),
          events: (events || []).filter(isVisible)
        }
      : {
          ...rawPayload,
          account: group(account),
          changes: getSample(account)
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
