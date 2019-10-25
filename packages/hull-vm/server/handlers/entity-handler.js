// @flow
import type {
  HullContext,
  HullEvent,
  HullIncomingHandlerMessage,
  HullExternalResponse
} from "hull";
import _ from "lodash";
import type { Entry } from "hull-vm";
import { compute } from "hull-vm";
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
  const { claim, entityType, events } = body;
  if (!claim) {
    return {
      status: 404,
      error: "Can't search for an empty value"
    };
  }
  const isUser = entityType === "user";
  try {
    // const getter = entity === "account" ? ctx.entities.accounts : ctx.entities.users;
    const rawPayload = await (isUser
      ? ctx.entities.users.get({
          claim,
          include: {
            events: {
              names: events,
              per_page: 20,
              page: 1
            }
          }
        })
      : ctx.entities.accounts.get({ claim }));

    if (!rawPayload) {
      return {
        status: 404,
        error: "Can't find user"
      };
    }
    const { group } = ctx.client.utils.traits;

    const payload = isUser
      ? {
          ...rawPayload,
          user: group(rawPayload.user),
          account: group(rawPayload.account),
          changes: getSample(rawPayload.user),
          events: (rawPayload.events || []).filter(isVisible)
        }
      : {
          ...rawPayload,
          account: group(rawPayload.account),
          changes: getSample(rawPayload.account)
        };

    const claims = getClaims(isUser ? "user" : "account", rawPayload);

    const result = await compute(ctx, {
      source: "processor",
      claims,
      entity: entityType,
      preview: true,
      payload,
      code
    });

    const data: Entry = {
      connectorId: connector.id,
      date: new Date().toString(),
      result,
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
