// @flow
import type {
  HullContext,
  HullUser,
  HullEvent,
  HullSegment,
  HullIncomingHandlerMessage,
  HullExternalResponse,
  HullUserUpdateMessage
} from "hull";
import _ from "lodash";
import type { Entry } from "hull-vm";
import { compute } from "hull-vm";
import { getEntity, getPayload } from "../lib/get-payload";

export default async function getUser(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse {
  const { connector } = ctx;
  const { private_settings } = connector;
  const { code } = private_settings;
  const { body } = message;
  const { search } = body;
  try {
    const user = await getEntity(ctx, search);
    const payload = await getPayload(ctx, user);
    if (payload.error) {
      throw new Error(payload.error);
    }
    const result = await compute(ctx, {
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
    ctx.client.logger.error("fetch.user.error", { error: err.message });
    return {
      status: 200,
      error: err.message
    };
  }
}
