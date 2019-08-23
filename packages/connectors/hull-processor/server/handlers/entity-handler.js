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

const EXCLUDED_EVENTS = [
  "Attributes changed",
  "Entered segment",
  "Left segment",
  "Segments changed"
];

export const isVisible = ({ event }: HullEvent) =>
  !_.includes(EXCLUDED_EVENTS, event);

export default async function getUser(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse {
  const { connector } = ctx;
  const { private_settings } = connector;
  const { code } = private_settings;
  const { body } = message;
  // $FlowFixMe
  const { claim, claimType, events } = body;
  console.log("Entry Fetch", body);
  try {
    // const getter = entity === "account" ? ctx.entities.accounts : ctx.entities.users;
    const rawPayload = await ctx.entities.users.get({
      claim,
      claimType,
      include: {
        events: {
          names: events,
          per_page: 20,
          page: 1
        }
      }
    });

    if (!rawPayload) {
      return {
        status: 404,
        error: "Can't find user"
      };
    }
    const { group } = ctx.client.utils.traits;

    const payload = {
      ...rawPayload,
      user: group(rawPayload.user),
      account: group(rawPayload.account),
      changes: getSample(rawPayload.user),
      events: (rawPayload.events || []).filter(isVisible)
    };

    const result = await compute(ctx, {
      source: "processor",
      claims: _.pick(rawPayload.user, ["id"]),
      preview: true,
      payload,
      code
    });

    const data: Entry = {
      connectorId: connector.id,
      date: new Date().toString(),
      code,
      result,
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
